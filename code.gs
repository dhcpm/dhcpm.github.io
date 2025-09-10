/**
 * @OnlyCurrentDoc
 * 이 스크립트는 웹페이지를 통해 Google 드라이브에 파일을 업로드하는 기능을 제공합니다.
 */

// ===============================================================
// === 사용자 설정 영역: Google 관련 입력값 ===
// ===============================================================

// 1. [필수] 파일을 업로드할 Google 드라이브 폴더의 ID를 입력하세요.
//    - 이 값은 실제 본인의 구글 드라이브 폴더 ID로 변경해야 합니다.
//    - 폴더 URL이 'https://https://drive.google.com/drive/u/0/folders/0AOTkW335xLryUk9PVA' 라면
//      'ABCDEFG12345'가 폴더 ID입니다.
const FOLDER_ID = "1oSXlx_MhAssw8jDssubpe9DG4LKb1Rm3"; // <-- !!! 본인의 폴더 ID로 꼭 수정해주세요 !!!

// ===============================================================
// === 스크립트 코드 (이 아래는 수정할 필요가 없습니다) ===
// ===============================================================

/**
 * 웹 앱이 GET 요청을 받을 때 실행되는 함수입니다.
 * 'index.html' 파일을 사용자에게 보여줍니다.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Google 드라이브 파일 업로더')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * 클라이언트(웹페이지)에서 파일 데이터를 받아 드라이브에 파일을 생성하는 함수입니다.
 * @param {object} fileData - 파일 이름, MIME 타입, Base64로 인코딩된 데이터가 포함된 객체입니다.
 * @return {string} - 성공 또는 실패 메시지를 반환합니다.
 */
function uploadFileToDrive(fileData) {
  // FOLDER_ID가 샘플 ID 그대로인지 또는 비어있는지 확인합니다.
  if (FOLDER_ID.includes("_샘플_ID입니다") || FOLDER_ID === "여기에_폴더_ID를_입력하세요") {
    const errorMessage = "오류: Google 드라이브 폴더 ID가 설정되지 않았습니다. Code.gs 파일에서 FOLDER_ID 값을 실제 폴더 ID로 수정해주세요.";
    console.error(errorMessage);
    return errorMessage;
  }
  
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // Base64 데이터를 디코딩하여 Blob 객체를 생성합니다.
    const decodedData = Utilities.base64Decode(fileData.data);
    const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.fileName);
    
    // 지정된 폴더에 파일을 생성합니다.
    const file = folder.createFile(blob);
    
    // 성공 메시지를 반환합니다.
    return `'${file.getName()}' 파일이 성공적으로 업로드되었습니다.`;

  } catch (e) {
    // 오류가 발생하면 오류 메시지를 반환합니다.
    console.error(`업로드 실패: ${e.toString()}`);
    // 좀 더 사용자 친화적인 에러 메시지를 반환합니다.
    if (e.message.includes("not found")) {
      return `업로드 실패: 지정된 폴더 ID '${FOLDER_ID}'를 찾을 수 없습니다. ID가 올바른지 확인해주세요.`;
    }
    return `업로드 실패: ${e.toString()}`;
  }
}

