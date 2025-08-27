// 파일 경로: src/types/index.d.ts

// '@types/navermaps' 패키지에서 naver 객체의 실제 타입을 가져옵니다.
import type { naver } from '@types/navermaps';

// window 전역 객체에 naver 객체가 존재하며,
// 그 타입은 '@types/navermaps'에서 가져온 naver 타입이라고 명시합니다.
declare global {
  interface Window {
    naver: naver;
  }
}