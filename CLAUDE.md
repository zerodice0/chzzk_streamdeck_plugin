# CHZZK Plugin

## 참고 문서

- [CHZZK Developers 공식 문서](https://chzzk.gitbook.io/chzzk)
- [Authorization](https://chzzk.gitbook.io/chzzk/chzzk-api/authorization)
- [Session](https://chzzk.gitbook.io/chzzk/chzzk-api/session)
- [User](https://chzzk.gitbook.io/chzzk/chzzk-api/user)
- [Channel](https://chzzk.gitbook.io/chzzk/chzzk-api/channel)
- [Category](https://chzzk.gitbook.io/chzzk/chzzk-api/category)
- [Live](https://chzzk.gitbook.io/chzzk/chzzk-api/live)
- [Chat](https://chzzk.gitbook.io/chzzk/chzzk-api/chat)
- [Drops](https://chzzk.gitbook.io/chzzk/chzzk-api/drops)
- [Restriction](https://chzzk.gitbook.io/chzzk/chzzk-api/restriction)
- [Tips](https://chzzk.gitbook.io/chzzk/chzzk-api/tips)

---

## API 요약

### 인증 (Authorization)

OAuth 2.0 Authorization Code 플로우 사용

| 단계 | 엔드포인트 | 설명 |
|------|-----------|------|
| 인증 코드 요청 | `https://chzzk.naver.com/account-interlock` | clientId, redirectUri, state 전송 |
| 토큰 발급 | `POST /auth/v1/token` | grantType: "authorization_code" |
| 토큰 갱신 | `POST /auth/v1/token` | grantType: "refresh_token" |
| 로그아웃 | `POST /auth/v1/token/revoke` | 토큰 삭제 |

- Access Token 유효기간: 1일 (86400초)
- Refresh Token 유효기간: 30일 (일회용)

### Session API

Socket.IO 기반 실시간 통신

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/open/v1/sessions/auth/client` | GET | 클라이언트 소켓 연결 URL |
| `/open/v1/sessions/auth` | GET | 유저 소켓 연결 URL |
| `/open/v1/sessions/client` | GET | 클라이언트 세션 조회 |
| `/open/v1/sessions` | GET | 유저 세션 조회 |

이벤트 구독:
- `/sessions/events/subscribe/chat` - 채팅 구독
- `/sessions/events/subscribe/donation` - 후원 구독
- `/sessions/events/subscribe/subscription` - 구독 이벤트

제한사항:
- 세션당 최대 30개 이벤트 구독
- 유저당 최대 3개 연결 (클라이언트는 10개)

### User API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/open/v1/users/me` | GET | 로그인 유저 정보 조회 |

응답: channelId, channelName

### Channel API

| 엔드포인트 | 메서드 | 인증 | 설명 |
|-----------|--------|------|------|
| `/open/v1/channels` | GET | Client | 채널 정보 조회 |
| `/open/v1/channels/streaming-roles` | GET | User | 채널 관리자 목록 |
| `/open/v1/channels/followers` | GET | User | 팔로워 목록 |
| `/open/v1/channels/subscribers` | GET | User | 구독자 목록 |

### Live API

| 엔드포인트 | 메서드 | 인증 | 설명 |
|-----------|--------|------|------|
| `/open/v1/lives` | GET | Client | 라이브 목록 (시청자순) |
| `/open/v1/streams/key` | GET | User | 스트림키 조회 |
| `/open/v1/lives/setting` | GET | User | 방송 설정 조회 |
| `/open/v1/lives/setting` | PATCH | User | 방송 설정 변경 |

카테고리: GAME, SPORTS, ETC

### Chat API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/open/v1/chats/send` | POST | 메시지 전송 (최대 100자) |
| `/open/v1/chats/notice` | POST | 공지 등록 |
| `/open/v1/chats/settings` | GET | 채팅 설정 조회 |
| `/open/v1/chats/settings` | PUT | 채팅 설정 변경 |

---

## Stream Deck SDK

### 참고 문서

- [Stream Deck SDK 공식 문서](https://docs.elgato.com/streamdeck/sdk/introduction/getting-started/)
- [Actions](https://docs.elgato.com/streamdeck/sdk/guides/actions)
- [Settings](https://docs.elgato.com/streamdeck/sdk/guides/settings)
- [Keys](https://docs.elgato.com/streamdeck/sdk/guides/keys)
- [Dials & Touch Strip](https://docs.elgato.com/streamdeck/sdk/guides/dials)
- [Property Inspectors](https://docs.elgato.com/streamdeck/sdk/guides/property-inspectors)
- [Manifest Reference](https://docs.elgato.com/streamdeck/sdk/references/manifest)

### 개발 환경 설정

요구사항:
- Node.js 20 이상
- Stream Deck 6.9 이상

```bash
npm install -g @elgato/cli   # CLI 설치
streamdeck create            # 플러그인 생성
npm run watch                # 개발 모드
```

### 플러그인 구조

```
plugin/
├── .sdPlugin/       # 컴파일된 플러그인
├── src/             # TypeScript 소스
└── manifest.json    # 플러그인 메타데이터
```

### Actions

액션 타입:
- **Key**: 표준 버튼, 페달, G-키
- **Dial**: Stream Deck +의 다이얼/터치스크린

주요 메서드:

| 메서드 | 설명 |
|--------|------|
| `getSettings()` | 설정 조회 |
| `setSettings()` | 설정 저장 |
| `showAlert()` | 경고 아이콘 표시 |
| `isDial()` / `isKey()` | 타입 판별 |

주요 이벤트:

| 이벤트 | 설명 |
|--------|------|
| `onWillAppear` | 액션이 화면에 나타날 때 |
| `onWillDisappear` | 액션이 사라질 때 |
| `onKeyDown` | 사용자 입력 |
| `onDidReceiveSettings` | 설정 업데이트 |
| `onSendToPlugin` | Property Inspector에서 메시지 수신 |

### Settings

두 가지 유형:
- **Action Settings**: 특정 액션에 연결 (프로필 내보내기에 포함됨)
- **Global Settings**: 플러그인 전체 적용 (API 키/토큰 저장용)

```typescript
// Action Settings
await ev.action.setSettings({ count: 1 });
const settings = ev.payload.settings;

// Global Settings
await streamDeck.settings.setGlobalSettings({ apiKey: "..." });
const global = await streamDeck.settings.getGlobalSettings();
```

### manifest.json 필수 필드

| 필드 | 설명 |
|------|------|
| `Author` | 제작자명 |
| `Name` | 플러그인 이름 |
| `Description` | 기능 설명 |
| `UUID` | 고유 식별자 (역DNS 형식) |
| `Version` | 버전 (major.minor.patch.build) |
| `CodePath` | 진입점 경로 |
| `Icon` | 플러그인 아이콘 |
| `Actions` | 액션 배열 |
| `OS` | 지원 OS 및 최소 버전 |
| `Software` | Stream Deck 최소 버전 |
| `SDKVersion` | SDK 버전 (2 또는 3) |

JSON 스키마: `https://schemas.elgato.com/streamdeck/plugins/manifest.json`

---

## 개발 시 참고사항

상세 정보가 필요한 경우 WebFetch로 해당 문서를 조회:
```
CHZZK: https://chzzk.gitbook.io/chzzk/chzzk-api/{api-name}
Stream Deck: https://docs.elgato.com/streamdeck/sdk/{section}/{page}
```
