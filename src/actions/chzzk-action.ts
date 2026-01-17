import { KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

/**
 * CHZZK Action - Stream Deck 액션
 */
export class ChzzkAction extends SingletonAction<ChzzkSettings> {
  /**
   * 액션의 UUID (manifest.json과 일치해야 함)
   */
  override readonly manifestId = "com.zerodice0.chzzk.action";

  /**
   * 액션이 Stream Deck에 나타날 때 호출됩니다.
   */
  override onWillAppear(ev: WillAppearEvent<ChzzkSettings>): void | Promise<void> {
    // 초기 타이틀 설정
    return ev.action.setTitle("CHZZK");
  }

  /**
   * 사용자가 키를 누를 때 호출됩니다.
   */
  override async onKeyDown(ev: KeyDownEvent<ChzzkSettings>): Promise<void> {
    // 키 입력 처리 로직
    await ev.action.showOk();
  }
}

/**
 * CHZZK 액션 설정 타입
 */
type ChzzkSettings = {
  // 설정 필드 추가 예정
};
