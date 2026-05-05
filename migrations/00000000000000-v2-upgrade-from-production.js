'use strict';

/**
 * 🚀 V2 Upgrade Migration — Safe for Production (backup.sql)
 *
 * This migration upgrades the production v1 database to v2 schema.
 * It is IDEMPOTENT — safe to run multiple times.
 *
 * Changes:
 * ── Tables ──
 * 1. CREATE "Sections" (new table)
 * 2. CREATE "TopicSections" (new join table)
 * 3. CREATE "SectionParts" (new join table)
 * 4. CREATE "TopicParts" (legacy join table from earlier migration)
 * 5. CREATE "ActivityLogs" (new table)
 * 6. CREATE "SequelizeMeta" (migration tracking)
 *
 * ── Columns (ADD) ──
 * 7.  Parts: add "SkillID" (uuid, FK → Skills)
 * 8.  Parts: remove "TopicID" (moved to TopicParts/SectionParts)
 * 9.  Questions: add "TopicPartID", "GroupID", "Tags", "CreatedBy", "UpdatedBy"
 * 10. Questions: remove "SkillID" (moved to Parts)
 * 11. Topics: add "Status", "ShuffleQuestions", "ShuffleAnswers", "CreatedBy", "UpdatedBy", "Duration", "ReasonReject"
 * 12. Sessions: add "duration", "instructions"
 * 13. Users: add "avatarUrl"
 * 14. StudentAnswerDrafts: add "SessionID"
 *
 * ── Enums (ALTER) ──
 * 15. Sessions.status: add DRAFT, PUBLISHED, ARCHIVED, DELETED
 * 16. Topics.Status: new enum (draft, submited, approved, rejected, archived)
 * 17. Sections.Status: new enum (draft, published, archived)
 * 18. ActivityLogs.action: new enum (create, update, delete)
 * 19. ActivityLogs.entityType: new enum (class, session, topic, question, part, section)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ═══════════════════════════════════════════
    // PHASE 1: ALTER ENUMs (MUST be outside transaction)
    // PostgreSQL does NOT allow ALTER TYPE ADD VALUE inside a transaction
    // ═══════════════════════════════════════════
    console.log('📌 Phase 1: Adding new ENUM values (outside transaction)...');

    const sessionStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED'];
    for (const val of sessionStatusValues) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_Sessions_status" ADD VALUE IF NOT EXISTS '${val}';`
        );
      } catch (e) {
        console.warn(`Could not add ${val} to enum_Sessions_status:`, e.message);
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 2: All DDL changes in a transaction
    // ═══════════════════════════════════════════
    console.log('📌 Phase 2: Schema changes (in transaction)...');
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════
      // 1. CREATE SequelizeMeta (if not exists)
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
          "name" VARCHAR(255) NOT NULL PRIMARY KEY
        );
      `, { transaction });

      // Mark ALL previous migrations as "already ran"
      // so they won't try to run again
      const previousMigrations = [
        '20250402031948-updated_SessionParticipant.js',
        '20250411024847-add-comment-to-studentanswers.js',
        '20250414024940-update_student_answert_sessionId_col.js',
        '20250415081934-add-dob.js',
        '20250415081935-add-publish-session.js',
        '20251112045741-add-topic-part.js',
        '20251112074146-update-part-and-question-table.js',
        '20251120161743-add-skillid-to-parts.js.js',
        '20251120161805-drop-skillid-from-questions.js.js',
        '20251120161822-add-sessionid-to-studentanswerdrafts.js.js',
        '20251210021710-add-reasonReject-to-topic.js',
        '20260311000000-add-duration-instructions-to-sessions.js',
        '20260311000001-add-archived-status-to-sessions.js',
        '20260316000000-add-tags-to-questions.js',
        '20260316000001-add-scoreconfig-to-topicsections.js',
        '20260318033820-add-session-status-workflow.js',
        '20260324000000-add-duration-to-topic.js',
        '20260331000000-create-activity-logs.js',
        '20260403000000-add-archived-to-topic-status.js',
        '20260404000000-add-status-to-sections.js',
        '20260406000000-add-archived-to-sections-status.js',
        '20260409000000-add-avatarUrl-to-users.js',
        '00000000000000-v2-upgrade-from-production.js',
      ];

      for (const name of previousMigrations) {
        await queryInterface.sequelize.query(`
          INSERT INTO "SequelizeMeta" ("name") VALUES (:name)
          ON CONFLICT ("name") DO NOTHING;
        `, { replacements: { name }, transaction });
      }

      // ═══════════════════════════════════════════
      // 3. ALTER "Topics" — add new columns
      // ═══════════════════════════════════════════

      // Create Topic Status enum
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Topics_Status') THEN
            CREATE TYPE "enum_Topics_Status" AS ENUM ('draft', 'submited', 'approved', 'rejected', 'archived');
          END IF;
        END$$;
      `, { transaction });

      // Add columns to Topics (if not exist)
      const topicColumns = [
        { name: 'Status', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "Status" "enum_Topics_Status" DEFAULT 'draft'` },
        { name: 'ShuffleQuestions', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "ShuffleQuestions" BOOLEAN NOT NULL DEFAULT false` },
        { name: 'ShuffleAnswers', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "ShuffleAnswers" BOOLEAN NOT NULL DEFAULT false` },
        { name: 'CreatedBy', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "CreatedBy" UUID REFERENCES "Users"("ID")` },
        { name: 'UpdatedBy', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "UpdatedBy" UUID REFERENCES "Users"("ID")` },
        { name: 'Duration', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "Duration" INTEGER` },
        { name: 'ReasonReject', sql: `ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "ReasonReject" VARCHAR(255)` },
      ];

      for (const col of topicColumns) {
        await queryInterface.sequelize.query(col.sql + ';', { transaction });
      }

      // ═══════════════════════════════════════════
      // 4. CREATE "Sections" table
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Sections_Status') THEN
            CREATE TYPE "enum_Sections_Status" AS ENUM ('draft', 'published', 'archived');
          END IF;
        END$$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Sections" (
          "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "Name" TEXT NOT NULL,
          "Description" TEXT,
          "SkillID" UUID REFERENCES "Skills"("ID") ON UPDATE CASCADE ON DELETE SET NULL,
          "Status" "enum_Sections_Status" DEFAULT 'draft',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `, { transaction });

      // ═══════════════════════════════════════════
      // 5. CREATE "TopicSections" join table
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "TopicSections" (
          "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "TopicID" UUID NOT NULL REFERENCES "Topics"("ID") ON UPDATE CASCADE ON DELETE CASCADE,
          "SectionID" UUID NOT NULL REFERENCES "Sections"("ID") ON UPDATE CASCADE ON DELETE CASCADE,
          "ScoreConfig" JSON,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `, { transaction });

      // ═══════════════════════════════════════════
      // 6. CREATE "SectionParts" join table
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "SectionParts" (
          "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "SectionID" UUID NOT NULL REFERENCES "Sections"("ID") ON UPDATE CASCADE ON DELETE CASCADE,
          "PartID" UUID NOT NULL REFERENCES "Parts"("ID") ON UPDATE CASCADE ON DELETE CASCADE,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `, { transaction });

      // ═══════════════════════════════════════════
      // 7. CREATE "TopicParts" join table (legacy)
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "TopicParts" (
          "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "TopicID" UUID NOT NULL REFERENCES "Topics"("ID") ON UPDATE CASCADE ON DELETE CASCADE,
          "PartID" UUID NOT NULL REFERENCES "Parts"("ID") ON UPDATE CASCADE ON DELETE CASCADE
        );
      `, { transaction });

      // ═══════════════════════════════════════════
      // 8. ALTER "Parts" — add SkillID, remove TopicID
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "SkillID" UUID REFERENCES "Skills"("ID") ON UPDATE CASCADE ON DELETE SET NULL;
      `, { transaction });

      // Make Sequence nullable (was NOT NULL)
      await queryInterface.sequelize.query(`
        ALTER TABLE "Parts" ALTER COLUMN "Sequence" DROP NOT NULL;
      `, { transaction });

      // Migrate TopicID data to TopicParts before dropping
      // First check if TopicID column exists
      const [topicIdCheck] = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'Parts' AND column_name = 'TopicID';
      `, { transaction });

      if (topicIdCheck.length > 0) {
        // Migrate existing Topic→Part relationships to TopicParts
        await queryInterface.sequelize.query(`
          INSERT INTO "TopicParts" ("ID", "TopicID", "PartID")
          SELECT gen_random_uuid(), "TopicID", "ID" FROM "Parts"
          WHERE "TopicID" IS NOT NULL
          ON CONFLICT DO NOTHING;
        `, { transaction });

        // Drop FK constraint first, then column
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE "Parts" DROP CONSTRAINT IF EXISTS "Parts_TopicID_fkey";
          `, { transaction });
        } catch (e) {
          console.warn('Could not drop Parts_TopicID_fkey:', e.message);
        }

        await queryInterface.sequelize.query(`
          ALTER TABLE "Parts" DROP COLUMN IF EXISTS "TopicID";
        `, { transaction });
      }

      // ═══════════════════════════════════════════
      // 9. ALTER "Questions" — add/remove columns
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        ALTER TABLE "Questions" ADD COLUMN IF NOT EXISTS "TopicPartID" UUID REFERENCES "TopicParts"("ID") ON UPDATE CASCADE ON DELETE SET NULL;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Questions" ADD COLUMN IF NOT EXISTS "GroupID" UUID;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Questions" ADD COLUMN IF NOT EXISTS "Tags" TEXT[] DEFAULT '{}';
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Questions" ADD COLUMN IF NOT EXISTS "CreatedBy" UUID REFERENCES "Users"("ID");
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Questions" ADD COLUMN IF NOT EXISTS "UpdatedBy" UUID REFERENCES "Users"("ID");
      `, { transaction });

      // ── Migrate SkillID from Questions → Parts ──
      // In v1: each Question has SkillID. In v2: SkillID moves to Parts.
      // Strategy: For each Part, find the SkillID of its first Question and copy it over.
      const [qSkillIdCheck] = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'Questions' AND column_name = 'SkillID';
      `, { transaction });

      if (qSkillIdCheck.length > 0) {
        // Step 1: Copy SkillID from Questions to their parent Parts
        console.log('📦 Migrating SkillID from Questions → Parts...');
        await queryInterface.sequelize.query(`
          UPDATE "Parts" p
          SET "SkillID" = sub."SkillID"
          FROM (
            SELECT DISTINCT ON ("PartID") "PartID", "SkillID"
            FROM "Questions"
            WHERE "SkillID" IS NOT NULL
            ORDER BY "PartID", "createdAt" ASC
          ) sub
          WHERE p."ID" = sub."PartID"
            AND p."SkillID" IS NULL;
        `, { transaction });

        // Step 2: Drop FK constraint and column from Questions
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE "Questions" DROP CONSTRAINT IF EXISTS "Questions_SkillID_fkey";
          `, { transaction });
        } catch (e) {
          console.warn('Could not drop Questions_SkillID_fkey:', e.message);
        }

        await queryInterface.sequelize.query(`
          ALTER TABLE "Questions" DROP COLUMN IF EXISTS "SkillID";
        `, { transaction });

        console.log('✅ SkillID migrated from Questions → Parts successfully');
      }

      // ═══════════════════════════════════════════
      // 10. ALTER "Sessions" — add new columns
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        ALTER TABLE "Sessions" ADD COLUMN IF NOT EXISTS "duration" INTEGER;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Sessions" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
      `, { transaction });

      // ═══════════════════════════════════════════
      // 11. ALTER "Users" — add avatarUrl
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "avatarUrl" VARCHAR(255);
      `, { transaction });

      // ═══════════════════════════════════════════
      // 12. ALTER "StudentAnswerDrafts" — add SessionID
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        ALTER TABLE "StudentAnswerDrafts" ADD COLUMN IF NOT EXISTS "SessionID" UUID REFERENCES "Sessions"("ID") ON UPDATE CASCADE ON DELETE CASCADE;
      `, { transaction });

      // ═══════════════════════════════════════════
      // 13. CREATE "ActivityLogs" table
      // ═══════════════════════════════════════════
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ActivityLogs_action') THEN
            CREATE TYPE "enum_ActivityLogs_action" AS ENUM ('create', 'update', 'delete');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ActivityLogs_entityType') THEN
            CREATE TYPE "enum_ActivityLogs_entityType" AS ENUM ('class', 'session', 'topic', 'question', 'part', 'section');
          END IF;
        END$$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "ActivityLogs" (
          "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "UserID" UUID REFERENCES "Users"("ID") ON UPDATE CASCADE ON DELETE SET NULL,
          "action" "enum_ActivityLogs_action" NOT NULL,
          "entityType" "enum_ActivityLogs_entityType" NOT NULL,
          "entityID" UUID,
          "entityName" VARCHAR(255),
          "details" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `, { transaction });

      await transaction.commit();
      console.log('✅ V2 upgrade migration completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ V2 upgrade migration FAILED:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Down migration is intentionally minimal for safety
    // Production data should be backed up before running
    console.warn('⚠️ Down migration for V2 upgrade is not recommended on production.');
    console.warn('   Restore from backup.sql instead.');
  },
};
