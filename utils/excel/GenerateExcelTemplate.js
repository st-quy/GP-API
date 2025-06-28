const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const {
  DataMultipleChoice,
  DataDropdownList,
  DataMatching,
  DataOrdering,
  DataListeningGroup,
  DataWriting,
  DataSpeaking,
} = require("./SampleData");

const generateExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();

  const applyHeaderStyle = (row) => {
    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
    });
  };

  const applyContentStyle = (sheet) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.eachCell((cell) => {
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };
      });
    });
  };

  const autoFitColumns = (sheet) => {
    sheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        const longestLine = val
          .split(/\r?\n/)
          .reduce((max, line) => Math.max(max, line.length), 0);
        maxLength = Math.max(maxLength, longestLine + 2);
      });
      column.width = maxLength;
    });
  };

  const setSelectiveColumnWidth = (sheet, width, excludeCols) => {
    sheet.columns.forEach((column, index) => {
      const colLetter = String.fromCharCode(65 + index);
      if (excludeCols.includes(colLetter)) {
        column.width = 28;
      } else {
        column.width = width;
      }
    });
  };
  const createAllQuestionsNoFormulaSheet = () => {
    const sheet = workbook.addWorksheet("All Questions");

    const headerAllQuestions = [
      "Topic Name",
      "Skill",
      "Part (You can further edit the title.)",
      "Sub Part",
      "Question Type",
      "Sequence",
      "Audio Link",
      "Image Link",
      "Question",
      "Question Content",
      "Correct Answer",
      "Sub Question",
      "Group Question",
    ];

    applyHeaderStyle(sheet.addRow(headerAllQuestions));

    const dropdowns = [
      {
        col: "B",
        values: [
          "Grammar & Vocabulary",
          "Writing",
          "Speaking",
          "Reading",
          "Listening",
        ],
      },
      {
        col: "C",
        values: [
          "Part 1: ...",
          "Part 2: ...",
          "Part 3: ...",
          "Part 4: ...",
          "Part 5: ...",
        ],
      },
      {
        col: "E",
        values: [
          "ordering",
          "multiple-choice",
          "dropdown-list",
          "matching",
          "listening-questions-group",
          "writing",
          "speaking",
        ],
      },
    ];

    for (let row = 2; row <= 2000; row++) {
      dropdowns.forEach(({ col, values }) => {
        const cell = sheet.getCell(`${col}${row}`);
        cell.value = "";
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${values.join(",")}"`],
          showErrorMessage: true,
          errorTitle: "Invalid Selection",
          error: `Please select a valid option for ${col}.`,
        };
      });
    }

    autoFitColumns(sheet);
    applyContentStyle(sheet);
    setSelectiveColumnWidth(sheet, 60, ["A", "B", "C", "E", "F", "G", "H"]);
    return sheet;
  };
  createAllQuestionsNoFormulaSheet();
  const createAllQuestionsSheet = () => {
    const sheet = workbook.addWorksheet("Suggested questions");

    const headers = [
      "Topic Name",
      "Skill",
      "Part (You can further edit the title.)",
      "Sub Part",
      "Question Type",
      "Sequence",
      "Audio link",
      "Image link",
      "Question",
      "Question Content",
      "Correct Answer",
      "Sub Question",
      "Group Question",
    ];

    applyHeaderStyle(sheet.addRow(headers));

    const dropdowns = [
      {
        col: "C",
        values: [
          "Part 1: ...",
          "Part 2: ...",
          "Part 3: ...",
          "Part 4: ...",
          "Part 5: ...",
        ],
      },
      {
        col: "E",
        values: [
          "ordering",
          "multiple-choice",
          "dropdown-list",
          "matching",
          "listening-questions-group",
          "writing",
          "speaking",
        ],
      },
    ];
    const questionTypes = [
      "multiple-choice",
      "multiple-choice",
      "dropdown-list",
      "dropdown-list",
      "ordering",
      "matching",
      "listening-questions-group",
      "writing",
      "speaking",
    ];

    const audioLink = [
      "https://example.com/audio1.mp3",
      "https://example.com/audio2.mp3",
    ];

    let audioIndex = 0;
    let usedTypes = {};

    for (let row = 2; row <= 10; row++) {
      const questionType = questionTypes[row - 2];
      const aCell = `A${row}`;
      const eCell = `E${row}`;
      const gCell = `G${row}`;
      const hCell = `H${row}`;
      const iCell = `I${row}`;
      const jCell = `J${row}`;
      const kCell = `K${row}`;
      const lCell = `L${row}`;
      const mCell = `M${row}`;

      sheet.getCell(eCell).value = questionType;

      sheet.getCell(aCell).value = "Practice Test 1";
      if (
        ["multiple-choice", "dropdown-list"].includes(questionType) &&
        !usedTypes[questionType]
      ) {
        sheet.getCell(gCell).value = audioLink[audioIndex++];
        usedTypes[questionType] = true;
      } else if (questionType === "listening-questions-group") {
        sheet.getCell(gCell).value = { formula: `DataTemplate!F8` };
      } else {
        sheet.getCell(gCell).value = "";
      }

      sheet.getCell(`B${row}`).value = {
        formula: `IF(${eCell}="speaking", "Speaking", 
    IF(${eCell}="writing", "Writing", 
    IF(${eCell}="dropdown-list", IF(${gCell}<>"", "Listening", "Grammar&vocabulary - Reading"), 
    IF(${eCell}="multiple-choice", IF(${gCell}<>"", "Listening", "Grammar&vocabulary - Reading"), 
    IF(${eCell}="ordering", " Grammar&vocabulary - Reading", 
    IF(${eCell}="matching", "Grammar&vocabulary - Reading", 
    IF(${eCell}="listening-questions-group", "Listening", "")))))))`,
      };

      sheet.getCell(hCell).value = {
        formula: `IF(${eCell}="speaking", IF(${gCell}<>"", "", DataTemplate!G10), "")`,
      };

      sheet.getCell(iCell).value = {
        formula:
          `IF(${eCell}="multiple-choice", IF(${gCell}<>"", DataTemplate!A3, DataTemplate!A2), ` +
          `IF(${eCell}="dropdown-list", IF(${gCell}<>"", DataTemplate!A5, DataTemplate!A4), ` +
          `IF(${eCell}="ordering", IF(${gCell}<>"", "", DataTemplate!A7), ` +
          `IF(${eCell}="matching", IF(${gCell}<>"", "", DataTemplate!A6), ` +
          `IF(${eCell}="writing", IF(${gCell}<>"", "", DataTemplate!A9), ` +
          `IF(${eCell}="speaking", IF(${gCell}<>"", "", DataTemplate!A10), ` +
          `IF(${eCell}="listening-questions-group", IF(${gCell}<>"", DataTemplate!A8, ""), "")))))))`,
      };

      sheet.getCell(jCell).value = {
        formula:
          `IF(${eCell}="multiple-choice", IF(${gCell}<>"", DataTemplate!D3, DataTemplate!D2), ` +
          `IF(${eCell}="dropdown-list", IF(${gCell}<>"", DataTemplate!D5, DataTemplate!D4), ` +
          `IF(${eCell}="ordering", IF(${gCell}<>"", "", DataTemplate!D7), ` +
          `IF(${eCell}="matching", IF(${gCell}<>"", "", DataTemplate!D6), ` +
          `IF(${eCell}="listening-questions-group", IF(${gCell}<>"", DataTemplate!D8, ""), "")))))`,
      };

      sheet.getCell(kCell).value = {
        formula:
          `IF(${eCell}="multiple-choice", IF(${gCell}<>"", DataTemplate!E3, DataTemplate!E2), ` +
          `IF(${eCell}="dropdown-list", IF(${gCell}<>"", DataTemplate!E5, DataTemplate!E4), ` +
          `IF(${eCell}="matching", IF(${gCell}<>"", "", DataTemplate!E6), ` +
          `IF(${eCell}="ordering", IF(${gCell}<>"", "", DataTemplate!E7), ` +
          `IF(${eCell}="listening-questions-group", IF(${gCell}<>"", DataTemplate!E8, ""), "")))))`,
      };

      sheet.getCell(lCell).value = {
        formula: `IF(${eCell}="writing", IF(${gCell}<>"", "", DataTemplate!B9), IF(${eCell}="matching", DataTemplate!B6, ""))`,
      };

      sheet.getCell(mCell).value = {
        formula:
          `IF(${eCell}="multiple-choice", IF(${gCell}<>"", DataTemplate!C3, DataTemplate!C2), ` +
          `IF(${eCell}="dropdown-list", IF(${gCell}<>"", DataTemplate!C5, DataTemplate!C4), ` +
          `IF(${eCell}="ordering", IF(${gCell}<>"", "", DataTemplate!C7), ` +
          `IF(${eCell}="listening-questions-group", IF(${gCell}<>"", DataTemplate!C8, ""), ""))))`,
      };

      dropdowns.forEach(({ col, values }) => {
        const cell = sheet.getCell(`${col}${row}`);
        cell.value = cell.value || "";
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${values.join(",")}"`],
          showErrorMessage: true,
          errorTitle: "Invalid Selection",
          error: `Please select a valid option for ${col}.`,
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
        };
      });
    }

    autoFitColumns(sheet);
    applyContentStyle(sheet);
    setSelectiveColumnWidth(sheet, 60, ["A", "B", "D", "E", "F", "G"]);
    return sheet;
  };

  const createDataSheet = (sheetName, headers, exampleRows) => {
    const sheet = workbook.addWorksheet(sheetName);
    applyHeaderStyle(sheet.addRow(headers));
    exampleRows.forEach((row) => sheet.addRow(row));
    applyContentStyle(sheet);
    autoFitColumns(sheet);

    return sheet;
  };

  createAllQuestionsSheet();

  createDataSheet(
    "DataTemplate",
    [
      "Question",
      "SubQuestion",
      "GroupQuestion",
      "Question Content",
      "Correct Answer",
      "Audio Link",
      "Image Link",
    ],
    [
      DataMultipleChoice[0],
      DataMultipleChoice[1],
      DataDropdownList[0],
      DataDropdownList[1],
      DataMatching,
      DataOrdering,
      DataListeningGroup,
      DataWriting,
      DataSpeaking,
    ]
  );

  const exportDir = path.join(__dirname, "../../../exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filePath = path.join(exportDir, "test-template.xlsx");
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

module.exports = { generateExcelTemplate };
