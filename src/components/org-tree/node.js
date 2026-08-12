const EVENTS = {
  CLICK: 'on-node-click',
  FOCUS: 'on-node-focus',
  MOUSEOUT: 'on-node-mouseout',
  MOUSEOVER: 'on-node-mouseover',
  DRAGSTART: 'on-node-drag-start',
  DRAGOVER: 'on-node-drag-over',
  DROP: 'on-node-drop'
}

function createListener(handler, data) {
  const execute = (cb, e, ...args) => {
    if (typeof cb === 'function') {
      // fixed bug #48, #73
      const className = e.target && e.target.className
      if (typeof className === 'string' && className.indexOf('org-tree-node-btn') > -1) return

      cb.apply(null, [e, ...args])
    }
  }

  return function (e) {
    if (Array.isArray(handler)) {
      for (const cb of handler) {
        execute(cb, e, data)
      }
    } else {
      execute(handler, e, data)
    }
  }
}

// 判断是否叶子节点
const isLeaf = (data, prop) => {
  return !(Array.isArray(data[prop]) && data[prop].length > 0)
}

// 创建 node 节点
export function renderNode(h, data, context, parentNode) {
  const { props } = context
  var cls = []
  var stuckNeckListLeft = [] // 卡脖子的元素左侧
  var stuckNeckListRight = [] // 卡脖子的元素右侧
  const children = data[props.props.children]
  // 子节点中存在卡脖子节点，则添加class，调整线的长度
  if (Array.isArray(children) && children.length) {
    children.forEach(item => {
      if (item.stuckNeckFlag && item.leftOrRight === 'left') {
        stuckNeckListLeft.push(item)
      } else if (item.stuckNeckFlag && item.leftOrRight === 'right') {
        stuckNeckListRight.push(item)
      } else if (item.stuckNeckFlag) {
        stuckNeckListLeft.push(item)
      }
    })
  }
  cls = ['org-tree-node']
  const childNodes = []
  // 卡脖子节点生成,左右两种,左面的先push右面的后push
  if (stuckNeckListLeft.length > 0) {
    createStuckNeckNode(h, stuckNeckListLeft, data, context, childNodes, 'org-tree-node-label-stuck-neck-left')
  }
  if (isLeaf(data, props.props.children)) {
    cls.push('is-leaf')
  } else if (props.collapsable && !data[props.props.expand]) {
    cls.push('collapsed')
  }
  childNodes.push(renderLabel(h, data, context, parentNode))
  // 只有全局设置不可折叠，局部设置的expand==true才生效,否则全部折叠
  if (!props.collapsable || data[props.props.expand]) {
    childNodes.push(renderChildren(h, children, context, data))
  }
  if (stuckNeckListRight.length > 0) {
    createStuckNeckNode(h, stuckNeckListRight, data, context, childNodes, 'org-tree-node-label-stuck-neck-right')
  }
  if (!data.stuckNeckFlag) {
    return h('div', {
      style: {
        '--lineCorlor': data.lineColor ? data.lineColor : '#ddd',
        '--lineWidthHorizontal': (data.lineWidthHorizontal ? data.lineWidthHorizontal : 1) + 'px', // 宽度 若没有宽度则默认2
        '--lineWidthVertical': (data.lineWidthVertical ? data.lineWidthVertical : 1) + 'px',
        '--verticalLineHeight': (19 - (data.lineWidthHorizontal || 0)) + 'px'
      },
      domProps: {
        className: cls.join(' ')
      }
    }, childNodes)
  }
}
function createStuckNeckNode(h, stuckNeckList, data, context, childNodes, className) {
  const { props, listeners } = context
  // 卡脖子节点生成,左右两种
  const { selectedClassName, selectedKey, labelClassName, renderContent } = props
  // event handlers
  const clickHandler = listeners[EVENTS.CLICK]
  const mouseOutHandler = listeners[EVENTS.MOUSEOUT]
  const mouseOverHandler = listeners[EVENTS.MOUSEOVER]
  if (stuckNeckList.length > 0) {
    stuckNeckList.forEach(item => {
      let labelWidth = item.labelWidthExpand || props.labelWidth
      const label = item[props.props.label]
      const content = typeof renderContent === 'function' ? renderContent(h, item) : label
      if (typeof labelWidth === 'number') {
        labelWidth = labelWidth + 'px'
      }
      const stuckNeckClassName = ['org-tree-node-label-inner', 'bg_node']
      let selectedClassNameTemp = selectedClassName
      if (typeof selectedClassNameTemp === 'function') {
        selectedClassNameTemp = selectedClassNameTemp(item)
      }
      selectedClassNameTemp && selectedKey && item[selectedKey] && stuckNeckClassName.push(selectedClassNameTemp)
      let labelClassNameTemp = labelClassName
      if (typeof labelClassName === 'function') {
        labelClassNameTemp = labelClassName(item)
      }
      labelClassNameTemp && stuckNeckClassName.push(labelClassNameTemp)
      const labelData = {
        domProps: {
          className: stuckNeckClassName.join(' ')
        },
        on: {
          'click': createListener(clickHandler, item),
          'mouseout': createListener(mouseOutHandler, item),
          'mouseover': createListener(mouseOverHandler, item)
        },
        style: {
          width: labelWidth,
          'z-index': 99999,
          'border': item.borderStyle,
          'background-color': item.backColor
        }
      }
      const labelChildren = []
      if (typeof renderContent === 'function' && typeof content === 'string') {
        labelData.domProps.innerHTML = content
      } else if (content !== undefined && content !== null) {
        labelChildren.push(content)
      }
      // 生成卡脖子虚拟节点
      var stuckNeckLabelVnode = h('div', {
        domProps: {
          className: className,
          draggable: false
        },
        // 连接线及节点框样式
        style: {
          // right: labelWidth + 50 + 'px',
          '--lineCorlor': data.lineColor ? data.lineColor : '#ddd',
          'z-index': 99999,
          '--lineWidthHorizontal': (item.lineWidthHorizontal ? item.lineWidthHorizontal : 1) + 'px',
          '--lineWidthVertical': (item.lineWidthVertical ? item.lineWidthVertical : 1) + 'px',
          '--verticalLineHeight': (19 - (item.lineWidthHorizontal || 0)) + 'px'
          // width: labelWidth
        }
      }, [h('div', labelData, labelChildren)])
      childNodes.push(stuckNeckLabelVnode)
    })
  }
}
// 创建展开折叠按钮
export function renderBtn(h, data, { props, listeners }) {
  const expandHandler = listeners['on-expand']
  let cls = ['org-tree-node-btn']
  // 若子元素中存在卡脖子节点，则折叠按钮需要下移40px
  var stuckNeckExist = false
  const children = data[props.props.children]
  if (Array.isArray(children) && children.length) {
    children.forEach(item => {
      if (item.stuckNeckFlag) {
        stuckNeckExist = true
      }
    })
  }

  if (data[props.props.expand]) {
    cls.push('expanded')
  }
  if (stuckNeckExist) {
    cls.push('org-tree-node-btn-stuck-neck')
    return h('span', {
      domProps: {
        className: cls.join(' ')
      },
      on: {
        click: (e) => expandHandler && expandHandler(e, data)
      }
    })
  } else {
    return h('span', {
      domProps: {
        className: cls.join(' ')
      },
      on: {
        click: (e) => expandHandler && expandHandler(e, data)
      }
    })
  }

}

// 创建 label 节点
export function renderLabel(h, data, context, parentData) {
  const { props, listeners } = context
  const label = data[props.props.label]
  const renderContent = props.renderContent

  // event handlers
  const clickHandler = listeners[EVENTS.CLICK]
  const focusHandler = listeners[EVENTS.FOCUS]
  const mouseOutHandler = listeners[EVENTS.MOUSEOUT]
  const mouseOverHandler = listeners[EVENTS.MOUSEOVER]
  const dragStartHandler = listeners[EVENTS.DRAGSTART]
  const dragOverHandler = listeners[EVENTS.DRAGOVER]
  const dropHander = listeners[EVENTS.DROP]
  const childNodes = []
  if (typeof renderContent === 'function') {
    const content = renderContent(h, data)
    if (typeof content === 'string') {
      childNodes.push(h('div', { domProps: { innerHTML: content } }))
    } else if (content !== undefined && content !== null) {
      childNodes.push(content)
    }
  } else {
    childNodes.push(label)
  }
  // childNodes.push(renderBtn(h, data, context))

  if (props.collapsable && !isLeaf(data, props.props.children)) {
    childNodes.push(renderBtn(h, data, context))
  }

  const cls = ['org-tree-node-label-inner']
  // 
  let { labelWidth, labelHeight, labelClassName, selectedClassName, selectedKey } = props
  if (data.labelWidthExpand) {
    labelWidth = data.labelWidthExpand
  }
  if (typeof labelWidth === 'number') {
    labelWidth += 'px'
  }
  if (typeof labelHeight === 'number') {
    labelHeight += 'px'
  }
  if (typeof labelClassName === 'function') {
    labelClassName = labelClassName(data)
  }
  labelClassName && cls.push(labelClassName)
  // 用户自定义的被选中节点的样式类
  if (typeof selectedClassName === 'function') {
    selectedClassName = selectedClassName(data)
  }
  selectedClassName && selectedKey && data[selectedKey] && cls.push(selectedClassName)
  if (!data.stuckNeckFlag) {
    return h('div', {
      attrs: {
        tabindex: 0,
        draggable: true
      },
      domProps: {
        className: 'org-tree-node-label'
      },
      on: {
        'dragstart': createListener(dragStartHandler, data),
        'dragover': createListener(dragOverHandler, data),
        'drop': createListener(dropHander, data),
        'focus': createListener(focusHandler, data)
      }
    }, [h('div', {
      domProps: {
        className: cls.join(' ')
      },
      style: {
        minHeight: labelHeight,
        width: labelWidth,
        '--lineCorlor': data.lineColor ? data.lineColor : '#ddd',
        '--lineWidthHorizontal': (data.lineWidthHorizontal ? data.lineWidthHorizontal : 1) + 'px',
        '--lineWidthVertical': (data.lineWidthVertical ? data.lineWidthVertical : 1) + 'px',
        '--verticalLineHeight': (19 - (data.lineWidthHorizontal ? data.lineWidthHorizontal : 0)) + 'px',
        'background-color': data.backColor,
        'border': data.borderStyle
      },
      // style: {},
      on: {
        'click': createListener(clickHandler, data),
        'mouseout': createListener(mouseOutHandler, data),
        'mouseover': createListener(mouseOverHandler, data)
      }
    }, childNodes)])
  }
}

// 创建 node 子节点
export function renderChildren(h, list, context, parentData) {
  var stuckNeckExistLeft = []
  var stuckNeckExistRight = []
  if (Array.isArray(list) && list.length) {
    const children = list.map(item => {
      if (item.stuckNeckFlag && item.leftOrRight === 'left') {
        stuckNeckExistLeft.push(item)
      } else if (item.stuckNeckFlag && item.leftOrRight === 'right') {
        stuckNeckExistRight.push(item)
      } else if (item.stuckNeckFlag) {
        stuckNeckExistLeft.push(item)
      }
      return renderNode(h, item, context, parentData)
    }).filter(Boolean)
    var stuckNeckExist = stuckNeckExistLeft.length > stuckNeckExistRight.length ? stuckNeckExistLeft.length : stuckNeckExistRight.length
    // 根据父节点的宽度计算偏移宽度，防止中轴线偏移(当只有一个子节点时才会有此问题)
    var marginLeft = '0px'
    if (parentData && parentData.labelWidthExpand) {
      // 如果此节点也有宽度则
      if (list[0].labelWidthExpand) {
        marginLeft = (parseInt(parentData.labelWidthExpand) - parseInt(list[0].labelWidthExpand)) / 2 - 10 + 'px'
      } else {
        marginLeft = (parseInt(parentData.labelWidthExpand) - parseInt(context.props.labelWidth)) / 2 - 10 + 'px'
      }
    }
    // 有卡脖子节点则中间的连接线加长,需要判断左右卡脖子的数量，以最大数量为准
    if (stuckNeckExist > 0) {
      return h('div', {
        domProps: {
          className: 'org-tree-node-children'
        },
        style: { 'top': stuckNeckExist * 59 + 'px' }
      }, children)
    } else {
      return h('div', {
        domProps: {
          className: 'org-tree-node-children'
        },
        style: { 'left': marginLeft }
      }, children)
    }
  }
  return ''
}

export function render(h, context) {
  const { props } = context
  return renderNode(h, props.data, context)
}

export default render
