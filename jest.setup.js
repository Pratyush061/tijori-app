/**
 * Jest setup: react-native-svg renders native views that the test renderer
 * cannot mount, so we swap it for plain Views during tests.
 */
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const stub = (name: string) => {
    const Component = (props: { children?: React.ReactNode }) =>
      React.createElement(View, null, props.children);
    Component.displayName = name;
    return Component;
  };
  return {
    __esModule: true,
    default: stub('Svg'),
    Svg: stub('Svg'),
    Circle: stub('Circle'),
    Path: stub('Path'),
    Rect: stub('Rect'),
    G: stub('G'),
    Line: stub('Line'),
    Polyline: stub('Polyline'),
    Polygon: stub('Polygon'),
    Text: stub('Text'),
    Defs: stub('Defs'),
    ClipPath: stub('ClipPath'),
    LinearGradient: stub('LinearGradient'),
    RadialGradient: stub('RadialGradient'),
    Stop: stub('Stop'),
  };
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  let cache = {};
  return {
    getItem: jest.fn((key) => {
      return new Promise((resolve) => {
        resolve(cache[key] || null);
      });
    }),
    setItem: jest.fn((key, value) => {
      return new Promise((resolve) => {
        cache[key] = value;
        resolve(null);
      });
    }),
    removeItem: jest.fn((key) => {
      return new Promise((resolve) => {
        delete cache[key];
        resolve(null);
      });
    }),
    clear: jest.fn(() => {
      return new Promise((resolve) => {
        cache = {};
        resolve(null);
      });
    }),
  };
});

jest.mock('react-native-fs', () => {
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});

jest.mock('react-native-image-picker', () => {
  return {
    launchCamera: jest.fn(),
    launchImageLibrary: jest.fn(),
  };
});

jest.mock('@10play/tentap-editor', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    RichText: (props) => React.createElement(View, props),
    Toolbar: (props) => React.createElement(View, props),
    useEditorBridge: jest.fn(() => ({
      getHTML: jest.fn(() => Promise.resolve('mock html')),
    })),
    TenTapStartKit: [],
    CoreBridge: {},
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: require('react-native').ScrollView,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    /* Buttons */
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    /* Other */
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
    GestureHandlerRootView: (props) => React.createElement(View, props, props.children),
    Gesture: {
      Pan: jest.fn(() => ({
        onStart: jest.fn().mockReturnThis(),
        onChange: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
      }))
    },
    GestureDetector: (props) => React.createElement(View, props, props.children),
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const View = require('react-native').View;

  const AnimatedView = React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref });
  });

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      Text: View,
      Image: View,
      ScrollView: View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((v) => v),
    withTiming: jest.fn((v) => v),
    runOnJS: jest.fn((fn) => fn),
    Easing: {
      out: jest.fn(),
      cubic: jest.fn(),
    }
  };
});

// Fix createAnimatedComponent mock
const ReanimatedMock = jest.requireMock('react-native-reanimated');
ReanimatedMock.default.createAnimatedComponent = (Component: any) => Component;
