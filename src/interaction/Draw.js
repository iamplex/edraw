import {createDefaultStyle, createEditingStyle} from '../style/Style.js'
import GeometryType from '../geometry/GeometryType.js'
import Point from '../geometry/Point.js'
import Circle from '../geometry/Circle.js'
import Line from '../geometry/Line.js'
import Polygon from '../geometry/Polygon.js'

/**
 * 用于绘制几何图形的交互
 *
 * @constructor
 * @param {Object} options
 */
function Draw(options) {

  /**
   * 绘图类型
   * @type {module:geometry/GeometryType}
   */
  this.type = typeof options === 'string' ? options : options.type

  /**
   * 是否手绘模式
   * @type {Boolean}
   */
  this.isFreehand = options.freehand !== undefined ? options.freehand : false

  /**
   * 是否正在绘图
   * @type {Boolean}
   */
  this.isDrawing = false

  /**
   * 草图坐标
   * @type {Array.<Number>}
   */
  this.sketchCoords

  /**
   * 草图元素
   * @type {module:geometry/Geometry}
   */
  this.sketchFeature

  /**
   * 当前Canvas 2D 绘图上下文
   * @type {CanvasRenderingContext2D}
   */
  this.context

  /**
   * 当前Canvas 2D 绘图上下文
   * @type {Array.<module:geometry/Geometry>}
   */
  this.features

  /**
   * 构造函数, 根据绘图类型获取相应的图形构造函数, 如果绘图类型为 'Custom', 使用Polygon构造函数
   * @constructor
   * @type {module:geometry/Geometry~Geometry}
   */
  this.geometryConstructor
  if (this.type === GeometryType.POINT) {
    this.geometryConstructor = Point
  } else if (this.type === GeometryType.CIRCLE) {
    this.geometryConstructor = Circle
  } else if (this.type === GeometryType.LINE) {
    this.geometryConstructor = Line
  } else if (this.type === GeometryType.POLYGON) {
    this.geometryConstructor = Polygon
  } else if (this.type === GeometryType.CUSTOM) {
    // 使用Circle构造函数更佳, Polygon过于冗余, 待修改
    // this.geometryConstructor = Circle
    this.geometryConstructor = Polygon
  }

  this.createGeometryCoordinates = options.createGeometryCoordinates
}

/**
 * 设置 Canvas 2D 绘图上下文
 * @param {CanvasRenderingContext2D} context
 */
Draw.prototype.setContext = function(context) {
  this.context = context
}

/**
 * 设置元素集合
 * @param {Array.<module:geometry/Geometry>} features
 */
Draw.prototype.setFeatures = function(features) {
  this.features = features
}

/**
 * 获取手绘状态
 * @return {Boolean} isFreehand
 */
Draw.prototype.getFreehandState = function() {
  return this.isFreehand
}

/**
 * 设置手绘状态
 * @param {Boolean} state
 */
Draw.prototype.setFreehandState = function(state) {
  this.isFreehand = state
}

/**
 * 设置绘制状态
 * @param {Boolean} state
 */
Draw.prototype.setDrawingState = function(state) {
  this.isDrawing = state
}

/**
 * 开始绘制草图
 * @param {Array.<Number>} coordinate 坐标
 */
Draw.prototype.startDrawing = function(coordinate) {
  this.setDrawingState(true)

  this.sketchCoords = [coordinate]

  this.sketchFeature = new this.geometryConstructor()
  this.sketchFeature.setStyle(createEditingStyle(this.sketchFeature.getType()))
  this.sketchFeature.setCoordinates(this.sketchCoords)
}

/**
 * 更新草图元素的最后一个坐标
 * @param {Array.<Number>} coordinate 坐标
 */
Draw.prototype.modifyDrawing = function(coordinate) {
  const
    drawType = this.type,
    geomType = this.sketchFeature.getType()

  this.sketchCoords[this.sketchCoords.length - 1] = coordinate

  if (geomType === GeometryType.CIRCLE) {
    const
      center = this.sketchFeature.getCenter(),
      dx = center[0] - coordinate[0],
      dy = center[1] - coordinate[1]

    this.sketchFeature.setRadius(Math.sqrt(dx * dx + dy * dy))
  }

  if (geomType === GeometryType.POLYGON) {
    if (drawType === GeometryType.POLYGON) {
      this.sketchFeature.setCoordinates(this.sketchCoords)
    } else {
      const coordinates = this.createGeometryCoordinates(this.sketchCoords[0], this.sketchCoords[1])
      this.sketchFeature.setCoordinates(coordinates)
    }
  }

  this.sketchFeature.render(this.context)
}

/**
 * 添加新坐标到草图元素
 * @param {Array.<Number>} coordinate 坐标
 */
Draw.prototype.addCoordinateDrawing = function(coordinate) {
  this.sketchCoords.push(coordinate)
  this.sketchFeature.setCoordinates(this.sketchCoords)

  if (this.isFreehand) {
    this.sketchFeature.render(this.context)
  }
}

/**
 * 草图绘制完成
 */
Draw.prototype.finishDrawing = function() {
  this.setDrawingState(false)

  const
    drawType = this.type,
    geomType = this.sketchFeature.getType()

  if (drawType === GeometryType.POINT) {
    this.sketchFeature.setRadius(5)
  } else if (drawType === GeometryType.POLYGON) {
    this.sketchCoords.push(this.sketchCoords[0])
    this.sketchFeature.setCoordinates(this.sketchCoords)
  }

  this.sketchFeature.setStyle(createDefaultStyle(geomType))
  this.features.push(this.sketchFeature)
  this.sketchFeature = null
}

export default Draw

/**
 * 创建一个函数, 它将返回一个正四边形的坐标(与坐标轴平行), 需要将Draw类的type设置为'Polygon'
 * @return {module:interaction/Draw~createGeometryCoordinates} 用于创建正四边形坐标的函数
 */
export function createBox() {
  return function(start, end) {
    const coordinates = [
        [start[0], start[1]],
        [end[0], start[1]],
        [end[0], end[1]],
        [start[0], end[1]],
        [start[0], start[1]]
      ]

    return coordinates
  }
}

/**
 * 创建一个函数, 它将返回一个正多边形的坐标, 需要将Draw类的type设置为'Polygon'
 * @param  {Number} sides 正多边形的边数
 * @return {module:interaction/Draw~createGeometryCoordinates} 用于创建正多边形坐标的函数
 */
export function createRegularPolygon(sides) {
  return function(start, end) {
    const
      dx = start[0] - end[0],
      dy = start[1] - end[1],
      radius = Math.sqrt(dx * dx + dy * dy),
      averageAngle = 360 / sides

    let startAngle = 180 * Math.atan((end[1] - start[1]) / (end[0] - start[0])) / Math.PI

    if (end[0] - start[0] >= 0 && end[1] - start[1] <= 0) {
      startAngle = startAngle + 360
    } else if (end[0] - start[0] >= 0 && end[1] - start[1] >= 0) {
      startAngle = startAngle
    } else if (end[0] - start[0] <= 0 && end[1] - start[1] >= 0) {
      startAngle = startAngle + 180
    } else if (end[0] - start[0] <= 0 && end[1] - start[1] <= 0) {
      startAngle = startAngle + 180
    }

    const coordinates = []

    for (let i = 0; i < sides; i++) {
      let angle = startAngle + averageAngle * i

      if (angle > 360) {
        angle = angle - 360
      }

      coordinates[i] = [
        start[0] + (radius * Math.cos(angle * Math.PI / 180)),
        start[1] + (radius * Math.sin(angle * Math.PI / 180))
      ]
    }

    coordinates[sides] = coordinates[0]

    return coordinates
  }
}


