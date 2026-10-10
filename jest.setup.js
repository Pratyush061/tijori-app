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
