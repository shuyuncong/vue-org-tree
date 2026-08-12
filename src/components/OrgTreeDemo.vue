<template>
  <div style="background: #fff;">
    <div style="float:left">
      <span @click="setImage" class="dept_camera" title="截图">
        截图 <img :src="cameraImage" width="30" class="logo" style="cursor: pointer" />
      </span>
    </div>
    <div class="container" :style="{ height:treeHeight+'px'}">
      <div id="orgTree">
        <div class="text-center orgTree">
          <vue2-org-tree @resetOrg="resetOrg" :data="tree" :collapsable="true" :label-class-name="labelClass" :render-content="renderContent" @on-node-click="onNodeClick" selected-class-name="selected-node" selected-key="selectedKey" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import vue2OrgTree from './org-tree/org-tree.vue'
import orgData from './test.json'
import html2canvas from 'html2canvas'
import panzoom from 'panzoom'
/** 窗口拖拽 */
export default {
  components: {
    vue2OrgTree
  },
  data() {
    return {
      tree: {},
      deptInfo: [],
      url: {
        queryDeptDetails: '/cc/dept/queryDeptDetail'
      },
      horizontal: false, // 横竖
      collapsable: true, // 子节点是否可折叠的
      expandAll: true,
      currentlevel: '1',
      zoomInstance: null,// zoom 实例
      currentDeptId: '',// 当前根节点
      neckNumber: 0,
      instance: null,
      treeHeight: 600,
      isdeptjob: false,
      isDrag: false,
      cameraImage: import.meta.env.BASE_URL + 'images/camera1.png'
    }
  },
  created() {
    this.getData()
  },
  mounted() {
    this.getTreeHeight()
    // 增加监听事件，窗口变化时得到高度。
    window.addEventListener('resize', this.getTreeHeight, false)
    if (this.originalDeptInfo) {
      let tempData = []
      tempData.push(this.originalDeptInfo)
      tempData = this.dealTree(tempData)
      // 只展示三级目录；业务规定
      let showData = this.dataDisplay(tempData, tempData[0].deptlevel)
      this.tree = showData[0]
      this.neckNumber = 0
    }
    setTimeout(x => {
      this.initZoom()
    }, 500)
  },
  methods: {
    getTreeHeight() {
      // 获取浏览器高度并计算得到表格所用高度。
      this.treeHeight = document.documentElement.clientHeight - 40
    },
    dataDisplay(data, level) {
      let temp = JSON.parse(JSON.stringify(data))
      var newTree = temp.filter(x => x.deptlevel <= parseInt(level) + 2)
      newTree.forEach(x => x.children && (x.children = this.dataDisplay(x.children, level)))
      return newTree
    },
    loaded() {},
    // 加载数据
    getData() {
      let result = orgData
      this.orgDeptTree = this.dealTree(result.children)
      this.tree = orgData
      this.$set(this.tree, 'label', '根')
      this.$set(this.tree, 'children', this.orgDeptTree)
    },
    // 处理数据
    dealTree(nodes = []) {
      for (let item of nodes) {
        item['lineColor'] = '#40A2FD' // 线的颜色
        item['lineWidthVertical'] = 2 // 线的宽度
        item['lineWidthHorizontal'] = 2
        if (item.deptsite === '01') {
          item['lineWidthVertical'] = 3
          item['stuckNeckFlag'] = true // 是否脖子节点
          if (this.neckNumber % 2 === 0) {
            item['leftOrRight'] = 'left' // 左右脖子
          } else {
            item['leftOrRight'] = 'right'
          }
          this.neckNumber++
        }
        if (item.deptlevel <= this.currentlevel) {
          item['lineWidthVertical'] = 2
          item['lineWidthHorizontal'] = 2
          item['labelWidthExpand'] = '200px'
        } else if (item.deptlevel === Number(this.currentlevel) + 1 + '') {
          item['lineWidthHorizontal'] = 3
          delete item.labelWidthExpand
          delete item.labelHeightExpand
          // 计算宽度
          let width1 = item.deptname.length
          let width2 = item.jobname.length + item.username.length + 1
          let width = width1 > width2 ? width1 : width2
          width = width * 15 + 45
          width = width > 150 ? width : 150
          item['labelWidthExpand'] = width + 'px'  // 自适应宽度
        } else if (item.deptlevel === Number(this.currentlevel) + 2 + '') {
          item['labelWidthExpand'] = '17px' // 节点长宽
          item['labelHeightExpand'] = '200px'
        } else {
          item['labelWidthExpand'] = '17px'
          item['labelHeightExpand'] = '200px'
        }
        if (item.children && item.children.length) {
          this.dealTree(item.children)
        }
      }
      return nodes
    },
    labelClass(h, data) {
      if (!h) {
        return 'common_department'
      }
      // 根据不同的属性设置不同的节点样式
      if (h.isjob === true) {
        if (h.deptlevel === '2') {
          return 'common_department_dashed'
        }
        if (h.deptlevel === '3') {
          return 'leaf_department_dashed'
        }
      }
      if (h.details === false) {
        if (h.deptlevel === Number(this.currentlevel) + 1 + '') {
          return 'disabled_department'
        } else if (h.deptlevel === Number(this.currentlevel) + 2 + '') {
          return 'disabled_leaf_department'
        }
      }
      // 添加虚拟部门
      if (h.deptlevel <= this.currentlevel) {
        return 'root_department'
      } else if (h.deptlevel === Number(this.currentlevel) + 1 + '') {
        if (h.depttype === '02') {
          return 'common_department_dashed'
        } else {
          return 'common_department'
        }
      } else if (h.deptlevel === Number(this.currentlevel) + 2 + '') {
        return 'leaf_department'
      } else {
        return 'leaf_department'
      }
    },
    // 节点点击
    onNodeClick(e, data) {
      if (this.isDrag) {
        return
      }
      // 没有详情不显示
      if (data.details === false) {
        return
      }
      // 记录当前节点
      this.currentDeptId = data.id
      console.log('节点点击')
    },
    // 点击图标
    clickButton(event) {
      event.stopPropagation()
      console.log('点击图标')
    },
    // 自己渲染节点样式
    renderContent(h, data) {
      const departmentName = Number(data.deptlevel) > Number(this.currentlevel) + 2
        ? this.dealContent(data.deptname)
        : data.deptname
      const departmentDetails = [h('div', { class: 'dept' }, departmentName)]
      // 一级二级显示负责人信息
      if (data.isjob === true && data.jobsite === '02') {
        departmentDetails.push(h('div', {
          class: 'dept_job',
          attrs: { id: `ID_${data.id}` }
        }, '\u00a0'))
      } else if (data.deptlevel < Number(this.currentlevel) + 2 + '') {
        departmentDetails.push(h('div', {
          class: 'dept_job',
          attrs: { id: `ID_${data.id}` }
        }, `${data.jobname}${data.jobname ? ':' : '--'}${data.username}`))
      }
      const content = [h('div', { class: 'dept_content' }, departmentDetails)]
      // 如果有子节点，显示图标
      if (data.children && data.deptlevel !== this.currentlevel && data.deptlevel !== '0') {
        content.push(h('div', {
          class: 'dept_icon',
          on: { click: this.clickButton }
        }, [h('span', [h('img', {
          class: 'logo',
          attrs: {
            src: import.meta.env.BASE_URL + 'images/structureExtend.png',
            width: 21
          },
          style: { cursor: 'pointer' }
        })])]))
      }
      return h('div', { class: 'dept_wrap' }, content)
    },
    dealContent(content) {
      if (!content) {
        return ''
      }
      return content
    },

    onExpand(h, data) {
      if ('expand' in data) {
        data.expand = !data.expand
        if (!data.expand && data.children) {
          this.collapse(data.children)
        }
      } else {
        this.$set(data, 'expand', true)
      }
    },

    onNodeMouseOver(e, data) {
      console.log('MOUSE OVER', e, data)
    },
    onNodeMouseOut(e, data) {
      console.log('MOUSE OUT', e)
    },
    onNodeDrop(e, drag, drop) {
      console.log('drag', e)
      console.log('drag:', drag)
      console.log('drop:', drop)
    },
    toggleExpand(data, val) {
      var _this = this
      if (Array.isArray(data)) {
        data.forEach(function(item) {
          _this.$set(item, 'expand', val)
          if (item.children) {
            _this.toggleExpand(item.children, val)
          }
        })
      } else {
        this.$set(data, 'expand', val)
        if (data.children) {
          _this.toggleExpand(data.children, val)
        }
      }
    },
    // 拖动页面
    moveZoom(deptId) {
      var pos
      if (deptId) {
        pos = this.departmentIsVisible(deptId).moveTo
      } else {
        pos = { x: 0, y: 0 }
      }
      this.zoomInstance.moveTo(pos.x, pos.y)
    },
    // 初始化zoom
    initZoom(deptId) {
      var area = document.querySelector('#orgTree')
      //   if (this.zoomInstance) this.zoomInstance.dispose()
      this.zoomInstance = panzoom(area, {
        smoothScroll: false,
        maxZoom: 1,
        minZoom: 0.3
      })
      var pos
      if (deptId) {
        pos = this.departmentIsVisible(deptId).moveTo
      } else {
        pos = { x: 0, y: 0 }
      }
      this.zoomInstance.moveTo(pos.x, pos.y)
      let _this = this
      // 移动或缩放结束
      this.zoomInstance.on('panend', function(e) {
        _this.isDrag = true
        setTimeout(x => {
          _this.isDrag = false
        }, 200)
      })
    },
    departmentIsVisible(deptId) {
      var el = document.getElementById('ID_' + deptId)
      var pr = document.getElementById('orgTree')
      var elb = el.getBoundingClientRect()
      var prb = pr.getBoundingClientRect()
      var windim = { w: window.innerWidth, h: window.innerHeight - 100 }
      var relpos = {
        y: prb.top - elb.top + 0.5 * windim.h,
        x: prb.left - elb.left + 0.5 * windim.w - 300
      }
      relpos.y = relpos.y > 0 ? 0 : relpos.y

      var isVissible = !(elb.bottom < 0 || elb.right < 300 || elb.left > window.innerWidth || elb.top > window.innerHeight)

      return { isVissible: isVissible, moveTo: relpos }
    },

    //   截取图片
    setImage() {
      this.initZoom()
      setTimeout(x => {
        this.capture()
      }, 500)
    },
    capture() {
      let that = this
      var canvas2 = document.createElement('canvas')
      let _canvas = document.getElementsByClassName('org-tree-container')
      _canvas = _canvas[0]
      var w = parseInt(window.getComputedStyle(_canvas).width)
      var h = parseInt(window.getComputedStyle(_canvas).height)
      // 将canvas画布放大若干倍，然后盛放在较小的容器内，就显得不模糊了
      canvas2.width = w * 2.5
      canvas2.height = h * 2.5
      canvas2.style.width = w + 'px'
      canvas2.style.height = h + 'px'
      // 可以按照自己的需求，对context的参数修改,translate指的是偏移量
      var context = canvas2.getContext('2d')
      context.scale(2, 2)
      html2canvas(document.getElementById('orgTree'), {
        canvas: canvas2
      }).then(function(canvas) {
        that.saveAs(canvas.toDataURL('image/png'), 'orgchart.png')
      })
    },
    saveAs(uri, filename) {
      var link = document.createElement('a')
      if (typeof link.download === 'string') {
        link.href = uri
        link.download = filename
        // Firefox requires the link to be in the body
        document.body.appendChild(link)
        // simulate click
        link.click()
        // remove the link when done
        document.body.removeChild(link)
      } else {
        window.open(uri)
      }
    },
    resetOrg(data) {
      // 如果子节点很多，根节点折叠时效果很差，
      if (data.deptlevel === '1') this.moveZoom()
    }
  }
}
</script>
<style  lang="less" >
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
}
body {
  height: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif;
  background: #f0f2f5;
}
.container {
  overflow: auto;
  overflow-x: hidden;
  overflow-y: hidden;
}
.orgTree {
  /* height: calc(100%); */
  margin-left: 200px;
  height: 535px;
}
.dept_wrap {
  display: inline-block;
  margin-left: -5px;
}
.root_dept {
  text-align: center;
  font-family: '思源黑体 CN', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 20px;
}
.dept {
  text-align: center;
  font-family: '思源黑体 CN', sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 16px;
}
.dept_job {
  text-align: center;
}
.dept_content {
  text-align: center;
}
.dept_icon {
  float: right;
  position: absolute;
  top: 45px;
  right: -20px;
}

// .org-tree-node-label {
//   white-space: nowrap;
//   border-radius: 10px;
// }

.active_department {
  border-radius: 10px;
}
.disabled_department {
  border: 2px solid #dfdfdf;
  background-color: #eeeeee;
  color: #6d737b;
  cursor: default;
  border-radius: 10px;
}
.leaf_department_dashed {
  background-color: rgba(255, 247, 242, 1);
  border: 2px dashed rgba(255, 173, 93, 1);
  color: rgba(255, 173, 93, 1) !important;
  cursor: pointer;
  border-radius: 8px;
  height: 200px;
  display: flex;
  align-items: center;
  margin: 0 auto;
  writing-mode: vertical-lr; /*从左向右 从右向左是 writing-mode: vertical-rl;*/
  writing-mode: tb-lr; /*IE浏览器的从左向右 从右向左是 writing-mode: tb-rl；*/
  justify-content: center;
}
.leaf_department {
  background-color: white !important;
  border: 2px solid #c4ddfa;
  color: #0a6ed2 !important;
  cursor: pointer;
  border-radius: 8px;
  height: 200px;
  display: flex;
  align-items: center;
  margin: 0 auto;
  writing-mode: vertical-lr; /*从左向右 从右向左是 writing-mode: vertical-rl;*/
  writing-mode: tb-lr; /*IE浏览器的从左向右 从右向左是 writing-mode: tb-rl；*/
  justify-content: center;
}
.disabled_leaf_department {
  border: 2px solid #dfdfdf;
  background-color: #eeeeee;
  color: #6d737b;
  cursor: default;
  border-radius: 8px;
  height: 200px;
  display: flex;
  align-items: center;
  margin: 0 auto;
  writing-mode: vertical-lr; /*从左向右 从右向左是 writing-mode: vertical-rl;*/
  writing-mode: tb-lr; /*IE浏览器的从左向右 从右向左是 writing-mode: tb-rl；*/
  justify-content: center;
}
.common_department {
  border: 2px solid #6db4f3;
  background-color: #f4f8ff !important;
  color: #0a6ed2 !important;
  cursor: pointer;
  border-radius: 14px;
}
.common_department_dashed {
  border: 2px dashed #6db4f3;
  background-color: #f4f8ff !important;
  color: #0a6ed2 !important;
  cursor: pointer;
  border-radius: 14px;
}
.root_department {
  border: 2px solid #55adfc;
  background-color: #48a7fc !important;
  color: #f4f8ff !important;
  cursor: pointer;
  border-radius: 40px;
}
.dept_number {
  font-size: 18px;
  color: #666666;
  margin-right: 16px;
}
.dept_people_number {
  font-size: 24px;
  color: #0a6ed2;
}
.dept_camera {
  width: 2em;
  height: 2em;
  font-size: 30px;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  cursor: pointer;
}
.breadselect {
  font-size: medium;
  color: #0a6ed2;
  cursor: pointer;
  font-size: 18px;
  margin-bottom: 14px;
}
.breaddefault {
  font-size: medium;
  color: #1a1a1a;
  cursor: text;
  font-size: 18px;
  margin-bottom: 14px;
}
</style>
