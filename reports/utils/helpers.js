function generateWritingSection(result) {
  const writingParts = result.writing || {};

  return Object.values(writingParts)
    .map((part) => {
      const partHtml = part.questions
        .map((q) => {
          return `
        <div class="question-container">
          <div class="question-header">Question ${q.Sequence}</div>
          <div class="question-content">
            <div class="answer-section">
              <div class="section-label">Answer</div>
              <div>${q.AnswerText || ""}</div>
            </div>
            <div class="comment-section">
              <div class="section-label">Comment</div>
              <div>${q.Comment}</div>
            </div>
          </div>
        </div>
      `;
        })
        .join("");

      return `
      <div class="assessment-section">
        <div class="assessment-content">
          <h4 class="part-title">${part.ContentPart}</h4>
          ${partHtml}
        </div>
      </div>
    `;
    })
    .join("");
}

function generateSpeakingSection(result, className, sessionName) {
  const speakingParts = result.speaking || {};

  const formatDownloadableCloudinaryUrl = (url, fileName) => {
    if (!url || !url.includes("/upload/")) return url;
    return url.replace("/upload/", `/upload/fl_attachment:${fileName}/`);
  };

  return Object.values(speakingParts)
    .map((part) => {
      const questionsHtml = part.questions
        .map((q) => {
          const fileName = `${className}_${sessionName}_part${part.ContentPart}_question${q.Sequence}`;
          const audioHtml = q.AnswerAudio
            ? `
              <a href="${
                q.AnswerAudio
              }" target="_blank" style="color: #4A90E2; text-decoration: none">Listen</a>
              <span style="color: #aaa;">|</span>
              <a href="${formatDownloadableCloudinaryUrl(
                q.AnswerAudio,
                fileName
              )}" style="color: #4A90E2; text-decoration: none;">Download</a>
            `
            : `<span style="color: #aaa;">(No audio available)</span>`;

          return `
            <div class="question-container">
              <div class="question-header">Question ${q.Sequence}</div>
              <div class="question-content">
                <div class="audio-section" style="margin-bottom: 6px;">
                  <span style="font-size: 13px; color: #888;">🔊 Audio: </span>
                  ${audioHtml}
                </div>
                <div class="comment-section">
                  <div class="section-label">Comment</div>
                  <div>${q.Comment}</div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="assessment-content">
          <h4 class="part-title">${part.ContentPart}</h4>
          ${questionsHtml}
        </div>
      `;
    })
    .join("");
}

module.exports = {
  generateWritingSection,
  generateSpeakingSection,
};
