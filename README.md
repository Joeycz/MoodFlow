# MoodFlow

MoodFlow 是一款专注于心情记录与追踪的移动应用。通过简洁优雅的界面，帮助你轻松记录每日心情，回顾心路历程，并支持生成精美的分享卡片。

## ✨ 功能特点

- **每日打卡 (Home)**: 快速选择心情图标，添加文字备注，记录当下的感受。
- **心情足迹 (Calendar)**: 以日历视图展示过往的心情记录，直观呈现情绪变化趋势。支持点击日期查看或编辑详情。
- **心情分享 (Share)**: 一键生成包含心情、备注的精美卡片，方便分享给朋友或保存留念。
- **极致体验**:
  - **触感反馈**: 在操作过程中提供细腻的 Haptic Feedback。
  - **流畅动画**: 使用 `LayoutAnimation` 和平滑的过渡效果。
- **隐私安全**: 所有数据均存储在本地 (`AsyncStorage`)，无需担心隐私泄露。

## 🛠 技术栈

本项目基于 **React Native** 和 **Expo** 开发。

- **核心框架**: [Expo](https://expo.dev/) (~54.0.25), [React Native](https://reactnative.dev/) (0.81.5)
- **主要依赖**:
  - [`react-native-calendars`](https://github.com/wix/react-native-calendars): 强大的日历组件，定制化显示心情圆点。
  - [`react-native-pager-view`](https://github.com/callstack/react-native-pager-view): 实现主界面的平滑分页切换。
  - [`expo-haptics`](https://docs.expo.dev/versions/latest/sdk/haptics/): 提供设备震动反馈。
  - [`expo-sharing`](https://docs.expo.dev/versions/latest/sdk/sharing/) & [`react-native-view-shot`](https://github.com/gre/react-native-view-shot): 实现截屏并分享功能。
  - [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/): 本地数据持久化。

## 🚀 快速开始

### 环境依赖

请确保你的开发环境已安装 [Node.js](https://nodejs.org/) 和 [Expo CLI](https://docs.expo.dev/get-started/installation/)。

### 安装步骤

1. **安装依赖**

   推荐使用 `pnpm`。

   ```bash
   pnpm install
   ```

2. **运行项目**

   ```bash
   pnpm start
   ```
   
   - 按 `i` 在 iOS 模拟器运行
   - 按 `a` 在 Android 模拟器运行
   - 或者使用 Expo Go App 扫描二维码在真机运行

## 📂 目录结构

```
MoodFlow/
├── App.js                  # 应用入口与主导航逻辑
├── src/
│   ├── components/         # 可复用组件
│   │   ├── MoodModal.js    # 心情详情/编辑弹窗
│   │   └── ...
│   ├── screens/            # 页面组件
│   │   ├── HomeScreen.js   # 打卡主页
│   │   ├── CalendarScreen.js # 足迹日历页
│   │   └── ShareScreen.js  # 分享页
│   ├── constants/          # 常量定义 (如 mood 列表)
│   └── utils/              # 工具函数 (如 haptics 封装)
├── assets/                 # 静态资源
└── package.json            # 项目配置
```

## 📝 开发备注

- 项目主要采用 React Hooks (`useState`, `useEffect`, `useRef`) 进行状态管理。
- 样式使用 `StyleSheet.create` 定义，适配 React Native 的样式系统。
- 针对中文用户优化了日历的本地化配置 (`LocaleConfig`)。

---

Enjoy your MoodFlow! 🎈
