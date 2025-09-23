import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { Pen, Eraser, Palette, RotateCcw, Save, X } from 'lucide-react-native';

interface DrawingCanvasProps {
  visible: boolean;
  onClose: () => void;
  onSave: (drawingData: string) => void;
  initialDrawing?: string;
}

interface PathData {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 32;
const CANVAS_HEIGHT = screenHeight * 0.6;

const COLORS = ['#000000', '#FF3B30', '#007AFF', '#34C759', '#FF9500', '#AF52DE', '#8E8E93'];
const STROKE_WIDTHS = [2, 4, 6, 8];

export function DrawingCanvas({ visible, onClose, onSave, initialDrawing }: DrawingCanvasProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
  const [isErasing, setIsErasing] = useState(false);
  const pathIdRef = useRef(0);

  // Helper function for eraser collision detection
  const isPointNearPath = (x: number, y: number, pathString: string): boolean => {
    // Simple proximity check - in a real app you'd use proper path collision detection
    const pathPoints = pathString.split(/[ML]/).filter(Boolean);
    return pathPoints.some(point => {
      const [px, py] = point.split(',').map(Number);
      if (isNaN(px) || isNaN(py)) return false;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      return distance < 20; // 20px tolerance
    });
  };

  // Load initial drawing if provided
  React.useEffect(() => {
    if (initialDrawing && visible) {
      try {
        const loadedPaths = JSON.parse(initialDrawing);
        setPaths(loadedPaths);
      } catch (error) {
        console.error('Error loading drawing:', error);
      }
    }
  }, [initialDrawing, visible]);

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      if (isErasing) {
        // Find and remove path at touch point
        const touchX = event.x;
        const touchY = event.y;
        setPaths(prevPaths => 
          prevPaths.filter(pathData => {
            // Simple collision detection - in a real app you'd want more sophisticated detection
            return !isPointNearPath(touchX, touchY, pathData.path);
          })
        );
      } else {
        // Start new drawing path
        const newPath = `M${event.x},${event.y}`;
        setCurrentPath(newPath);
      }
    })
    .onUpdate((event) => {
      if (!isErasing) {
        setCurrentPath(prev => `${prev} L${event.x},${event.y}`);
      }
    })
    .onEnd(() => {
      if (!isErasing && currentPath) {
        const newPathData: PathData = {
          id: `path-${pathIdRef.current++}`,
          path: currentPath,
          color: currentColor,
          strokeWidth: currentStrokeWidth,
        };
        setPaths(prev => [...prev, newPathData]);
        setCurrentPath('');
      }
    });

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const handleSave = () => {
    const drawingData = JSON.stringify(paths);
    onSave(drawingData);
    onClose();
  };

  const handleClose = () => {
    // Reset state when closing
    setPaths([]);
    setCurrentPath('');
    setIsErasing(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Draw Notes
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Save size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Drawing Tools */}
          <View style={styles.toolSection}>
            <TouchableOpacity
              style={[
                styles.toolButton,
                { backgroundColor: !isErasing ? colors.primary : 'transparent' }
              ]}
              onPress={() => setIsErasing(false)}
            >
              <Pen size={20} color={!isErasing ? '#FFFFFF' : colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toolButton,
                { backgroundColor: isErasing ? colors.error : 'transparent' }
              ]}
              onPress={() => setIsErasing(true)}
            >
              <Eraser size={20} color={isErasing ? '#FFFFFF' : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Colors */}
          <View style={styles.toolSection}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  currentColor === color && styles.selectedColor,
                ]}
                onPress={() => setCurrentColor(color)}
              />
            ))}
          </View>

          {/* Stroke Width */}
          <View style={styles.toolSection}>
            {STROKE_WIDTHS.map((width) => (
              <TouchableOpacity
                key={width}
                style={[
                  styles.strokeButton,
                  { backgroundColor: currentStrokeWidth === width ? colors.primary : colors.background }
                ]}
                onPress={() => setCurrentStrokeWidth(width)}
              >
                <View
                  style={[
                    styles.strokePreview,
                    {
                      width: width * 2,
                      height: width * 2,
                      backgroundColor: currentStrokeWidth === width ? '#FFFFFF' : colors.text,
                    }
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Clear */}
          <TouchableOpacity
            style={[styles.toolButton, { backgroundColor: colors.error }]}
            onPress={clearCanvas}
          >
            <RotateCcw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <View style={[styles.canvasContainer, { backgroundColor: '#FFFFFF' }]}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.canvas}>
              <Svg
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={styles.svg}
              >
                <G>
                  {/* Existing paths */}
                  {paths.map((pathData) => (
                    <Path
                      key={pathData.id}
                      d={pathData.path}
                      stroke={pathData.color}
                      strokeWidth={pathData.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}
                  
                  {/* Current drawing path */}
                  {currentPath && !isErasing && (
                    <Path
                      d={currentPath}
                      stroke={currentColor}
                      strokeWidth={currentStrokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                </G>
              </Svg>
            </View>
          </GestureDetector>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            {isErasing 
              ? 'Tap on drawn lines to erase them'
              : 'Draw with your finger or stylus. Use the toolbar to change colors and brush size.'
            }
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  toolSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  strokeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokePreview: {
    borderRadius: 10,
  },
  canvasContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  canvas: {
    flex: 1,
  },
  svg: {
    flex: 1,
  },
  instructions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});