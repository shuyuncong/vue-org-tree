<template>
  <div class="org-tree-container">
    <!-- key的作用是监视到data改变时，重新渲染组件 -->
    <div class="org-tree" :key="treeNodeKey" :class="{horizontal, collapsable}">
      <org-tree-node :data="data" :props="props" :horizontal="horizontal" :label-width="labelWidth" :collapsable="collapsable" :render-content="renderContent" :label-class-name="labelClassName" :selected-class-name="selectedClassName" :selected-key="selectedKey" :label-height="labelHeight" @on-expand="onExpand" @on-node-focus="(e, data) => $emit('on-node-focus', e, data)" @on-node-click="(e, data) => $emit('on-node-click', e, data)"
        @on-node-mouseover="(e, data) => $emit('on-node-mouseover', e, data)" @on-node-mouseout="(e, data) => $emit('on-node-mouseout', e, data)" @on-node-drag-start="(e, data) => onDragStart(e, data)" @on-node-drag-over="(e, data) => onDragOver(e, data)" @on-node-drop="(e, data) => onDrop(e, data)" />
    </div>
  </div>
</template>



<script>
import render from './node'

export default {
  name: 'Vue2OrgTree',
  data() {
    return {
      treeNodeKey: 0,
      dragState: {
        drag: null,
        drop: null
      }
    }
  },
  components: {
    OrgTreeNode: {
      render,
      functional: true
    }
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    props: {
      type: Object,
      default: () => ({
        label: 'label',
        expand: 'expand',
        children: 'children'
      })
    },
    horizontal: Boolean,
    selectedKey: String,
    collapsable: Boolean,
    renderContent: Function,
    labelWidth: {
      type: [String, Number],
      default: '150px'
    },
    labelClassName: [Function, String],
    selectedClassName: [Function, String],
    labelHeight: {
      type: [String, Number],
      default: '20px'
    }
  },
  methods: {
    onDragStart(event, data) {
      let dragState = this.dragState
      try {
        event.dataTransfer.setData('text/plain', '')
      } catch (e) {}
      dragState.drag = data
      this.$emit('on-node-drag-start', event, data)
    },
    onDragOver(event, data) {
      event.preventDefault()
      this.$emit('on-node-drag-over', event, data)
    },
    onDrop(event, data) {
      event.preventDefault()
      let dragState = this.dragState
      let drag = dragState.drag
      dragState.drop = data
      this.$emit('on-node-drop', event, drag, data)
    },
    onExpand(e, data) {
      const expandKey = this.props.expand
      const childrenKey = this.props.children
      const expanded = !data[expandKey]
      this.$set(data, expandKey, expanded)
      if (!expanded && data[childrenKey]) {
        this.collapse(data[childrenKey])
      }
      this.$nextTick(() => {
        // 加载完成后调整卡脖子节点位置
        this.stuckNeckSelfAdaption()
      })
      this.$emit('on-expand', data, expanded)
      this.$emit('resetOrg', data)
    },
    collapse(nodes) {
      const expandKey = this.props.expand
      const childrenKey = this.props.children
      nodes.forEach(node => {
        if (node[expandKey]) {
          this.$set(node, expandKey, false)
        }
        node[childrenKey] && this.collapse(node[childrenKey])
      })
    },
    // 自适应调整
    stuckNeckSelfAdaption() {
      // 加载完成后调整卡脖子节点位置
      // 获取所有左侧卡脖子节点
      var stuckNeckListLeft = document.querySelectorAll('div.org-tree-node-label-stuck-neck-left')
      this.leftRightStuckNeck(stuckNeckListLeft, 'org-tree-node-label-stuck-neck-left')
      var stuckNeckListRight = document.querySelectorAll('div.org-tree-node-label-stuck-neck-right')
      this.leftRightStuckNeck(stuckNeckListRight, 'org-tree-node-label-stuck-neck-right')
      // 重新计算所有children节点的left属性
      var childrenList = document.querySelectorAll('div.org-tree-node-children')
      childrenList.forEach(item => {
        // 找到父容器宽度
        var parentDivWidth = item.parentNode.offsetWidth
        var childrenStyle = item.style
        var childrenWidth = item.offsetWidth
        // this.$set(childrenStyle,'left',(parentDivWidth-childrenWidth)/2+'px')
        this.$set(childrenStyle, 'left', (parentDivWidth - childrenWidth) / 2 - 20 + 'px')
        // 若兄弟节点中有卡脖子节点，则将本children节点的before、after伪元素的高度设置为0
        var leftStuckNeckTemp = item.parentNode.getElementsByClassName('org-tree-node-label-stuck-neck-left')
        var rightStuckNeckTemp = item.parentNode.getElementsByClassName('org-tree-node-label-stuck-neck-right')
        if (leftStuckNeckTemp.length > 0 || rightStuckNeckTemp.length > 0) {
          childrenStyle.setProperty('--afterHeight', '0px')
        } else {
          childrenStyle.setProperty('--afterHeight', '20px')
        }
      })
    },
    // 调整左右卡脖子的位置
    leftRightStuckNeck(stuckNeckList, className) {
      // 获取卡脖子节点的兄弟元素(只有一个)
      stuckNeckList.forEach((item, index) => {
        var sibilingsList = Array.from(item.parentNode.children)
        // 获取被卡脖子的节点
        sibilingsList = sibilingsList.filter(o => {
          return o.className === 'org-tree-node-label'
        })
        if (!sibilingsList.length) return
        // 获取被卡脖子的节点的高度
        var height = sibilingsList[0].offsetHeight
        // 设置卡脖子元素的margin-top,如果有多个则每次
        var styleStuckNeck = item.style
        // 获取本级父容器的宽度，以便设置卡脖子节点上下左右的位置
        var orgTreeNode = item.parentNode
        if (className.indexOf('left') != -1) {
          this.$set(styleStuckNeck, 'right', orgTreeNode.offsetWidth / 2 + item.offsetWidth / 2 + 'px')
        } else if (className.indexOf('right') != -1) {
          this.$set(styleStuckNeck, 'left', orgTreeNode.offsetWidth / 2 + item.offsetWidth / 2 + 'px')
        }
        var stuckNeckList = Array.from(orgTreeNode.childNodes).filter(e => {
          return e.className === className
        })
        // 被卡脖子节点
        var stuckNeckTop = 0 // 所有卡脖子节点累加top值高度
        stuckNeckList.forEach((element, index1) => {
          if (element.className === className) {
            // 设置上下位置 index1*10 设置同侧的卡脖子节点之间的间距
            var styleTemp = element.style
            if (index1 > 0) {
              stuckNeckTop = stuckNeckList[index1 - 1].offsetHeight + stuckNeckTop
              this.$set(styleTemp, 'top', height + stuckNeckList[index1 - 1].offsetHeight + 19 + (index1 + 1) * 10 + 'px')
            } else {
              stuckNeckTop = height + stuckNeckTop
              this.$set(styleTemp, 'top', height + (index1 + 1) * 10 + 19 + 'px')
            }
          }
        })
        // 获取被卡脖子节点连接的折叠按钮
        var collapsableBtnStuckNeckList = sibilingsList[0].firstElementChild.getElementsByClassName('org-tree-node-btn-stuck-neck')
        if (!collapsableBtnStuckNeckList.length) return
        var collapsableBtnStuckNeckStyle = collapsableBtnStuckNeckList[0].style
        // 设置折叠按钮的top属性,需要根据左右两边卡脖子节点的数量来定，哪边数量多以哪边为准
        var leftStuckNeckListLength = Array.from(orgTreeNode.childNodes).filter(e => {
          return e.className === 'org-tree-node-label-stuck-neck-left'
        }).length
        var rightStuckNeckListLength = Array.from(orgTreeNode.childNodes).filter(e => {
          return e.className === 'org-tree-node-label-stuck-neck-right'
        }).length
        item.style.setProperty('--afterBeforHeight', item.offsetHeight / 2 + 25 + 'px')
        item.style.setProperty('--beforTop', item.offsetHeight / 2 + 'px')
        item.style.setProperty('--afterTop', -10 + 'px') // 填满两个节点之间的10px间隙
        if (leftStuckNeckListLength >= rightStuckNeckListLength && className === 'org-tree-node-label-stuck-neck-left') {
          // 两边都有卡脖子节点则去掉元素较少的那侧的卡脖子节点的竖线，防止竖线重复
          orgTreeNode.childNodes.forEach(temp => {
            if (temp.className === 'org-tree-node-label-stuck-neck-right') {
              temp.style.setProperty('--lineWidthVertical', '0px')
            }
          })
          var itemChildrenElement = item.parentNode.getElementsByClassName('org-tree-node-children')[0]
          if (itemChildrenElement) {
            this.$set(itemChildrenElement.style, 'top', stuckNeckTop + 10 * leftStuckNeckListLength + 14 + 'px')
          }
          this.$set(collapsableBtnStuckNeckStyle, 'top', height + stuckNeckTop + 10 * leftStuckNeckListLength + 25 + 'px')
        } else if (leftStuckNeckListLength < rightStuckNeckListLength && className === 'org-tree-node-label-stuck-neck-right') {
          // 两边都有卡脖子节点则去掉元素较少的那侧的卡脖子节点的竖线，防止竖线重复
          orgTreeNode.childNodes.forEach(temp => {
            if (temp.className === 'org-tree-node-label-stuck-neck-left') {
              temp.style.setProperty('--lineWidthVertical', '0px')
            }
          })
          // 计算卡脖子节点同级的children节点距离容器上边缘的距离 top = 被卡脖子高度+10*卡脖子
          var itemChildrenElement = item.parentNode.getElementsByClassName('org-tree-node-children')[0]
          if (itemChildrenElement) {
            this.$set(itemChildrenElement.style, 'top', stuckNeckTop + 10 * rightStuckNeckListLength + 14 + 'px')
          }
          this.$set(collapsableBtnStuckNeckStyle, 'top', height + stuckNeckTop + 10 * rightStuckNeckListLength + 25 + 'px')
        }
        this.$set(collapsableBtnStuckNeckStyle, 'display', 'table')
      })
    }
  },
  mounted() {
    this.stuckNeckSelfAdaption()
  },
  watch: {
    data: {
      handler(newData, oldData) {
        ++this.treeNodeKey
        this.$nextTick(() => {
          // 加载完成后调整卡脖子节点位置
          this.stuckNeckSelfAdaption()
        })
      },
      deep: true
    }
  }
}
</script>

<style lang="less">
@import '../../styles/org-tree';
</style>
