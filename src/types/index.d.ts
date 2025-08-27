// 파일 경로: src/types/index.d.ts

// naver 객체가 window 전역 객체에 존재한다고 타입스크립트에게 알려줍니다.
declare global {
  interface Window {
    naver: any;
  }
}
