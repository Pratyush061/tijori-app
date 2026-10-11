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
