const express = require('express');
const { google } = require('googleapis');
const exceljs = require('exceljs');
const stream = require('stream');
const cors = require('cors');

// ========================= ▼▼▼ 사용자 설정 영역 ▼▼▼ =========================

// 1. [필수] 'instructions.md' 안내서 3-5단계에서 복사한 Google Drive 폴더 ID를 입력하세요.
const TARGET_FOLDER_ID = '129TP7o91oBP0qrcab7i0FZRoE8nmwWpP';

// 2. [필수] 'instructions.md' 안내서 2-10단계에서 다운로드한 인증 키 파일의 경로를 입력하세요.
const KEY_FILE_PATH = '../json/gsuite-portal2021-6039d6f7a59b.json'; 

// 3. [선택] 서버가 실행될 포트 번호입니다.
const PORT = 3000;

// ============================================================================

const app = express();
app.use(cors()); // 모든 도메인에서의 요청을 허용 (CORS 처리)
app.use(express.json());

// Google Drive API 인증 설정
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// 파일 업로드 API 엔드포인트
app.post('/upload', async (req, res) => {
  try {
    const data = req.body;

    if (!data.departmentName || !data.documentTitle) {
      return res.status(400).json({ message: '오류: 필수 데이터가 누락되었습니다.' });
    }
    
    // 1. 엑셀 파일 생성 (메모리상에서)
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('제출 내용');
    
    sheet.columns = [
      { header: '항목', key: 'key', width: 20 },
      { header: '내용', key: 'value', width: 60 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF3F4F6'} };


    const content = [
        { key: '제출 일시', value: new Date().toLocaleString() },
        { key: '부서명', value: data.departmentName },
        { key: '문서명', value: data.documentTitle },
        { key: '문서번호', value: data.documentNumber },
        { key: '중간평가 주체', value: data.evaluator },
        { key: '위원회 개최여부', value: data.committeeStatus },
        { key: '위원회 미개최 사유', value: data.committeeNotHeldReason }
    ];
    sheet.addRows(content);

    const buffer = await workbook.xlsx.writeBuffer();
    
    // 2. Google Drive에 업로드
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `부서운영 중간평가_${data.departmentName}_${dateString}.xlsx`;
    
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [TARGET_FOLDER_ID],
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: bufferStream,
      },
      fields: 'id,webViewLink,name'
    });

    res.status(200).json({
      message: '성공적으로 제출되어 파일이 생성되었습니다.',
      fileInfo: {
          id: response.data.id,
          name: response.data.name,
          url: response.data.webViewLink
      }
    });

  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json({ message: `서버 오류가 발생했습니다: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log('웹페이지에서 양식을 제출하면 Google Drive에 파일이 업로드됩니다.');
});

