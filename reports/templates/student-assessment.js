const Handlebars = require("handlebars");
const html = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Student Information</title>
    <style>
      * {
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
      }
      body {
        font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        -webkit-font-smoothing: antialiased;
        line-height: 1.4;
      }
      table {
        border-collapse: separate;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        width: 100%;
      }
      table td {
        vertical-align: top;
        padding: 5px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        position: relative;
        height: 60px;
      }
      .logo {
        width: 200px;
        height: auto;
        position: absolute;
      }
      .logo-left {
        left: 0;
        top: 0;
      }
      .logo-right {
        right: 0;
        top: 0;
      }
      .student-name {
        text-align: center;
        margin: 20px 0;
      }
      .student-name h2 {
        margin: 5px 0;
      }
      .student-name p {
        margin: 5px 0;
        color: #666;
      }
      .info-section {
        border: 1px solid #ddd;
        margin-bottom: 20px;
        padding: 15px;
        background-color: #FFFFFF;
      }
      .info-section h3 {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }
      .info-grid {
        display: table;
        width: 100%;
      }
      .info-item {
        display: table-row;
      }
      .info-item .label,
      .info-item span:not(.label) {
        display: table-cell;
        padding: 5px;
        word-break: break-word;
        -ms-word-break: break-word;
      }
      .label {
        color: #666;
        width: 120px;
      }
      .score-grid {
        display: table;
        width: 100%;
      }
      .assessment-section {
        margin-bottom: 20px;
        overflow: hidden;
      }
      .assessment-header {
        background-color: #F8F8F8;
        padding: 15px;
        border-bottom: 1px solid #ddd;
      }
      .assessment-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }
      .total-score {
        display: inline-block;
        margin-left: 10px;
      }
      .score-value {
        padding: 3px 10px;
        border: 1px solid #ddd;
        border-radius: 3px;
        background-color: #fff;
        min-width: 30px;
        text-align: center;
      }
      .assessment-subtitle {
        padding: 10px 15px;
        background-color: #F0F0F0;
        font-size: 14px;
        color: #666;
      }
      .assessment-content {
        padding: 15px;
      }
      .part-title {
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 15px;
      }
      .question-group {
        margin-bottom: 15px;
      }
      .question-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }
      .question-box,
      .comment-box {
        display: flex;
        flex-direction: column;
      }
      .question-header,
      .comment-header {
        background-color: #E0E0E0;
        padding: 8px;
        font-weight: 600;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
      }
      .question-content,
      .comment-content {
        border: 1px solid #ddd;
        padding: 10px;
        min-height: 80px;
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
      }
      .question-content.empty {
        min-height: 80px;
      }
      .comment-content {
        min-height: 80px;
      }
      .section-label {
        color: #000;
        font-weight: bold;
        display: block;
        margin-bottom: 5px;
      }
      .answer-section {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      .answer-section {
        background-color: #F9F9F9;
        padding: 10px;
        border-radius: 4px;
      }
      .comment-section {
        background-color: #F0F7FF;
        padding: 10px;
        border-radius: 4px;
      }
      .info-item span {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .student-name h2, .student-name p {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .assessment-content > *:not(:last-child) {
        margin-bottom: 16px;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 800px; margin: 0 auto;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
            <tr>
              <td width="200" style="vertical-align: top;">
                <img src="https://res.cloudinary.com/nguyentranson/image/upload/v1744856378/image_720_nqjlda.png"
                     alt="University of Greenwich Logo"
                     style="width: 200px; height: auto; display: block;" />
              </td>
              <td style="text-align: right;" width="200">
                <img src="https://res.cloudinary.com/dki5tuvt0/image/upload/v1745397493/c61gagqwkrnm7fy1i0cv.png"
                     alt="GreenPREP Logo"
                     style="width: 200px; height: auto; display: block; margin-left: auto;" />
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
            <tr>
              <td align="center">
                <h2 style="margin: 5px 0; font-size: 24px;">{{{studentName}}}</h2>
                <p style="margin: 5px 0; color: #666;">STUDENT</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; border: 1px solid #ddd; background-color: #FFFFFF;">
            <tr>
              <td style="padding: 15px;">
                <table width="100%" cellpadding="5" cellspacing="0" border="0">
                  <tr>
                    <td colspan="4">
                      <h3 style="margin-top: 0; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">Student Information</h3>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" style="color: #666;">Student ID:</td>
                    <td>{{{studentId}}}</td>
                    <td width="120" style="color: #666;">Email:</td>
                    <td>{{{studentEmail}}}</td>
                  </tr>
                  <tr>
                    <td width="120" style="color: #666;">Phone:</td>
                    <td>{{{phone}}}</td>
                    <td width="120" style="color: #666;">Class:</td>
                    <td>{{{className}}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; border: 1px solid #ddd; background-color: #FFFFFF;">
            <tr>
              <td style="padding: 15px;">
                <table width="100%" cellpadding="5" cellspacing="0" border="0">
                  <tr>
                    <td colspan="4">
                      <h3 style="margin-top: 0; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">All Score</h3>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" style="color: #333; font-weight: bold;">Band Level:</td>
                    <td colspan="3"><span style="background-color: #CCE5FF; color: #0066CC; padding: 4px 12px; border-radius: 4px; font-size: 16px; font-weight: bold;">{{{Level}}}</span></td>
                  </tr>
                  <tr>
                    <td width="120" style="color: #666;">Grammar & Vocab:</td>
                    <td>{{{GrammarAndVocab}}}</td>
                    <td width="120" style="color: #666;">Listening:</td>
                    <td>{{{Listening}}} | {{{ListeningLevel}}}</td>
                  </tr>
                  <tr>
                    <td width="120" style="color: #666;">Reading:</td>
                    <td>{{{Reading}}} | {{{ReadingLevel}}}</td>
                    <td width="120" style="color: #666;">Speaking:</td>
                    <td>{{{Speaking}}} | {{{SpeakingLevel}}}</td>
                  </tr>
                  <tr>
                    <td width="120" style="color: #666;">Writing:</td>
                    <td>{{{Writing}}} | {{{WritingLevel}}}</td>
                    <td width="120" style="color: #666;">Total:</td>
                    <td>{{{Total}}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; border: 1px solid #ddd; background-color: #FFFFFF;">
            <tr>
              <td style="background-color: #F8F8F8; padding: 15px; border-bottom: 1px solid #ddd;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 18px; font-weight: bold;">Speaking Assessment Part</td>
                    <td align="right">
                      <span style="color: #333;">Total Score: </span>
                      <span style="display: inline-block; background: #FFFFFF; border: 1px solid #ddd; padding: 3px 10px; min-width: 30px; text-align: center;">
                        {{{Speaking}}}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px;">
                {{{speakingSection}}}
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; border: 1px solid #ddd; background-color: #FFFFFF;">
            <tr>
              <td style="background-color: #F8F8F8; padding: 15px; border-bottom: 1px solid #ddd;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size: 18px; font-weight: bold;">Writing Assessment Part</td>
                    <td align="right">
                      <span style="color: #333;">Total Score: </span>
                      <span style="display: inline-block; background: #FFFFFF; border: 1px solid #ddd; padding: 3px 10px; min-width: 30px; text-align: center;">
                        {{{Writing}}}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px;">
                {{{writingSection}}}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
module.exports = Handlebars.compile(html);
