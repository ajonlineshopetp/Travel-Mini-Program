// pages/detail/detail.js
/**
 * Author : 丸子团队（波波、Chi、ONLINE.信）
 * Github 地址: https://github.com/dchijack/Travel-Mini-Program
 * GiTee 地址： https://gitee.com/izol/Travel-Mini-Program
 */
const API = require('../../utils/api')
const WxParse = require('../../wxParse/wxParse')
const app = getApp()
let isFocusing = false

Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 1,
    audio: '',
    detail:'',
    textNum: 0,
    comments: [],
    isPlaying: false,
    placeholder: '输入评论'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    qq.getSystemInfo({
      success: function (a) {
        that.setData({
          isIphoneX: a.model.match(/iPhone X/gi)
        })
      }
    })
    this.setData({options:options})
    this.getPostsbyID(options.id)
    this.getAdvert()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if(app.globalData.user) {
      this.setData({
        user: app.globalData.user
      })
    }
    this.audioCtx = qq.createInnerAudioContext()
		this.audioCtx.onEnded(() => {
			if(this.data.isPlaying) {
				this.setData({isPlaying:false})
			}
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if(this.data.isPlaying) {
			this.audioCtx.stop()
		}
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      page: 1,
      detail: '',
      comments: []
    })
    this.getPostsbyID(this.data.options.id)
    this.getComments()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (!this.data.isLastPage) {
      this.getComments();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: this.data.detail.title.rendered,
      path: '/pages/detail/detail?id=' + this.data.detail.id,
      imageUrl: this.data.detail.meta.thumbnail
    }
  },

  getPostsbyID: function(id) {
    let that = this;
    API.getPostsbyID(id).then(res => {
      that.setData({
        id: id,
        detail: res
      })
      WxParse.wxParse('article', 'html', res.content.rendered, this, 5);
      if (res.comments != 0) {
        this.getComments()
      }
    })
    .catch(err => {
      console.log(err)
    })
  },

  getAdvert: function() {
    API.detailAdsense().then(res => {
      //console.log(res)
      if(res.status === 200) {
        this.setData({
          advert: res.data
        })
      }
    })
    .catch(err => {
      console.log(err)
    })
  },

  getComments: function() {
    API.getComments({
      id: this.data.options.id,
      page: this.data.page
    }).then(res => {
      let data = {}
      if (res.length < 10) {
        this.setData({
          isLastPage: true,
          loadtext: '到底啦',
          showloadmore: false
        })
      }
      if (this.data.isBottom) {
        data.comments = [].concat(this.data.comments, res)
        data.page = this.data.page + 1
      } else {
        data.comments = [].concat(this.data.comments, res)
        data.page = this.data.page + 1
      }
      this.setData(data)
    })
  },

  bindFavTap: function(e) {
    //console.log(e)
    let args = {}
    let detail = this.data.detail
    args.id = detail.id
    API.fav(args).then(res => {
      //console.log(res)
      if (res.status === 200) {
        detail.isfav = true
        this.setData({
          detail: detail,
        })
        qq.showToast({
          title: '加入收藏!',
          icon: 'success',
          duration: 900,
        })
      } else if (res.status === 202) {
        detail.isfav = false
        this.setData({
          detail: detail,
        })
        qq.showToast({
          title: '取消收藏!',
          icon: 'success',
          duration: 900,
        })
      } else {
        qq.showModal({
          title: '温馨提示',
          content: '数据出错, 建议清除缓存重新尝试',
          success: response => {
            qq.removeStorageSync('user')
            qq.removeStorageSync('token')
            qq.removeStorageSync('expired_in')
          }
        })
      }
    })
    .catch(err => {
      console.log(err)
    })
  },

  bindLikeTap: function(e) {
    //console.log(e)
    let args = {}
    let detail = this.data.detail
    args.id = detail.id
    API.like(args).then(res => {
      //console.log(res)
      if (res.status === 200) {
        detail.islike = true
        this.setData({
          detail: detail,
        })
        qq.showToast({
          title: '谢谢点赞!',
          icon: 'success',
          duration: 900,
        })
      } else if (res.status === 202) {
        detail.islike = false
        this.setData({
          detail: detail,
        })
        qq.showToast({
          title: '取消点赞!',
          icon: 'success',
          duration: 900,
        })
      } else {
        qq.showModal({
          title: '温馨提示',
          content: '数据出错, 建议清除缓存重新尝试',
          success: response => {
            qq.removeStorageSync('user')
            qq.removeStorageSync('token')
            qq.removeStorageSync('expired_in')
          }
        })
      }
    })
    .catch(err => {
      console.log(err)
    })
  },

  addComment: function(e) {
    //console.log(e)
    let args = {}
    let that = this
    args.id = this.data.detail.id
    args.content = this.data.content
    args.parent = this.data.parent
    args.formid = e.detail.formId
    if (!this.data.user) {
      qq.showModal({
        title: '提示',
        content: '必须授权登录才可以评论',
        success: function(res) {
          if (res.confirm) {
            that.getProfile();
          }
        }
      })
    } else if (args.content.length === 0) {
      qq.showModal({
        title: '提示',
        content: '评论内容不能为空'
      })
    } else {
      API.addComment(args).then(res => {
        console.log(res)
        if (res.status === 200) {
          this.setData({
            page: 1,
            showTextarea: false,
            content: "",
            comments: [],
            placeholder: "",
            focus: false
          })
          setTimeout(function() {
            qq.showModal({
              title: '温馨提示',
              content: res.message
            })
          }, 900)
          if (!this.data.isComments) {
            this.setData({
              isComments: true,
              placeholder: ''
            })
          }
          this.getComments()
        } else if (res.status === 500) {
          qq.showModal({
            title: '提示',
            content: '评论失败，请稍后重试。'
          })
        } else {
          qq.showModal({
            title: '提示',
            content: '必须授权登录才可以评论',
            success: function(res) {
              if (res.confirm) {
                that.getProfile();
              }
            }
          })
        }
      })
      .catch(err => {
        console.log(err)
        qq.showModal({
          title: '提示',
          content: '评论失败，请稍后重试。'
        })
      })
    }
  },

  replyComment: function(e) {
    //console.log(e)
    isFocusing = true
    let parent = e.currentTarget.dataset.parent
    let reply = e.currentTarget.dataset.reply
    this.setData({
      focus: true,
      isReply: true,
      parent: parent,
      placeholder: " 回复 " + reply + ":"
    })
  },

  getProfile: function() {
    qq.showLoading({
      title: '正在登录...',
    })
    API.getProfile().then(res => {
        //console.log(res)
        this.setData({
          user: res
        })
        qq.hideLoading()
      })
      .catch(err => {
        console.log(err)
        qq.hideLoading()
      })
  },

  onRepleyFocus: function(e) {
    isFocusing = false
    console.log('onRepleyFocus', isFocusing)
    if (!this.data.focus) {
      this.setData({
        focus: true
      })
    }
  },

  onReplyBlur: function(e) {
    var that = this;
    if (!that.data.focus) {
      const text = e.detail.value.trim();
      if (text === '') {
        that.setData({
          parent: "0",
          placeholder: "评论...",
          commentdate: ""
        });
      }
    } else {
      that.setData({
        placeholder: "不说算了，口亨",
        focus: false
      })
    }
    //console.log(isFocusing)
  },

  bindInputContent: function(e) {
    if (e.detail.value.length > 0) {
      this.setData({
        content: e.detail.value,
        textNum: e.detail.value.length,
        iscanpublish: true
      })
    } else {
      this.setData({
        iscanpublish: false
      })
    }
  },

  tapcomment: function(e) {
    var self = this;
    let id = e.currentTarget.id;
    if (id) {
      this.setData({
        id: id,
        showTextarea: true
      })
    } else {
      this.setData({
        showTextarea: true
      })
    }
    setTimeout(function() {
      self.setData({
        focus: true
      });
    }, 100);
  },

  closeCommentary: function() {
    this.setData({
      showTextarea: false
    });
  },

  bindBack: function() {
    qq.navigateBack()
  },

  shareClick: function () {
    this.setData({
      shareshow: true,
    })
  },

  _handleZanActionsheetMaskClick: function () {
    this.setData({
      shareshow: false,
    })
  },

  downloadPrefix: function () {
    let that = this
    let qrcodePath = '../../images/qrcode.png'
    let prefixPath = ''
    let title = this.data.detail.title.rendered
    let excerpt = this.data.detail.excerpt.rendered
    const downloadTaskCoverPrefix = qq.downloadFile({
      url: that.data.detail.meta.thumbnail,
      success: response => {
        if (response.statusCode === 200) {
          prefixPath = response.tempFilePath;
          console.log("文章图片本地位置：" + response.tempFilePath);
          if (prefixPath && qrcodePath) {
            that.createPostPrefix(prefixPath, qrcodePath, title, excerpt);
          }
        } else {
          qq.hideLoading();
          qq.showToast({
            title: "下载封面失败",
            mask: true,
            duration: 2000
          });
        }
      }
    });
    downloadTaskCoverPrefix.onProgressUpdate((res) => {
      qq.showLoading({
        title: "正在下载封面...",
        mask: true,
      });
      console.log('下载下载封面进度：' + res.progress)
    })
  },
  //将canvas转换为图片保存到本地，然后将路径传给image图片的src
  createPostPrefix: function (prefixPath, qrcodePath, title, excerpt) {
    //console.log(excerpt);
    qq.showLoading({
      title: "正在生成海报",
      mask: true,
    });
    let textTitle = title.replace(/<\/?.+?>/g,"").replace(/[\r\n]/g, "").replace(/ /g,"")
    let textExcerpt = excerpt.replace(/<\/?.+?>/g,"").replace(/[\r\n]/g, "").replace(/ /g,"")
    let context = qq.createCanvasContext('prefix');
    context.setFillStyle('#ffffff');//填充背景色
    context.fillRect(0, 0, 600, 970);
    context.drawImage(prefixPath, 0, 0, 600, 400);//绘制首图
    context.drawImage(qrcodePath, 40, 720, 180, 180);//绘制二维码
    context.setFillStyle("#333333");
    context.setFontSize(32);
    context.setTextAlign('left');
    context.fillText("丸子小程序", 240, 780);
    context.setFillStyle("#666666");
    context.setFontSize(28);
    context.setTextAlign('left');
    context.fillText("又一个 WordPress 小程序", 240, 830);
    context.setFillStyle("#696969");
    context.setFontSize(24);
    context.setTextAlign('left');
    context.fillText("阅读详情,请长按识别二维码", 240, 880);
    context.setFillStyle("#000000");   
    this.CanvasTextContent(context, textTitle, textExcerpt);//文章标题
    context.draw();
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(function () {
      qq.canvasToTempFilePath({
        canvasId: 'prefix',
        success: function (res) {
          qq.hideLoading();
          qq.previewImage({
            current: res.tempFilePath,
            urls: [res.tempFilePath]
          })
          console.log("海报图片路径：" + res.tempFilePath);
        },
        fail: function (res) {
          console.log(res);
          qq.hideLoading();
        }
      });
    }, 900);
  },

  CanvasTextContent: function(context, title, excerpt) {
    let textLength = title.replace(/[\u0391-\uFFE5]/g, "aa").length
    context.setFillStyle("#000000")
    if ( textLength <= 17 ) {
      //14字以内绘制成一行，美观一点
      context.setFontSize(30)
      context.setTextAlign('left')
      context.fillText(title, 30, 460)
    } else {
      //题目字数很多的，只绘制前34个字（如果题目字数在15到18个字则也是一行，不怎么好看）
      context.setFontSize(30)
      context.setTextAlign('left')
      context.fillText(title.substring(0, 18), 30, 460)
      context.fillText(title.substring(18, 36), 30, 520)
    }
    context.setFillStyle("#666666")
    context.setFontSize(24)
    context.setTextAlign('left')
    context.fillText(excerpt.substring(0, 22), 35, 580)
    context.fillText(excerpt.substring(23, 44), 35, 624)
    context.fillText(excerpt.substring(45, 64), 35, 668)
    context.stroke()
    context.save()
  },

  bindCopyLink: function(link) {
    qq.setClipboardData({
      data: link,
      success: function (res) {
        qq.getClipboardData({
          success: function (res) {
            qq.showToast({
              title: '复制链接',
              icon: 'success',
              duration: 2000
            })
          }
        })
      }
    })
  },

  bindOpenDocument: function(link) {
    qq.showLoading({
      title: '正在下载...',
      mask: true
    })
    qq.downloadFile({
      url: link,
      success: function (res) {
        qq.hideLoading()
        let filePath = res.tempFilePath
        qq.showLoading({
          title: '正在打开文档',
          mask: true
        })
        qq.openDocument({
          filePath: filePath,
          success: function (res) {
            console.log(res)
            qq.showToast({
              title: '打开文档成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: function (err) {
            console.log(err)
            qq.showToast({
              title: '打开文档失败',
              icon: 'loading',
              duration: 2000
            })
          },
          complete: function () {
            qq.hideLoading()
          }
        })
      },
      fail: function (err) {
        console.log(err)
        qq.hideLoading()
        this.bindCopyLink(link)
      }
    })
  },

  wxParseTagATap: function(e) {
    let that = this
    let domain = API.getHost()
	  let link = e.currentTarget.dataset.src
	  let appid = e.currentTarget.dataset.appid
	  let type = e.currentTarget.dataset.type
    let path = e.currentTarget.dataset.path
    if( typeof (type) != 'undefined' ) {
      if( type == 'miniprogram' && typeof (appid) != 'undefined' && appid.length > 0  ) {
        let app = ""
        if( appid.indexOf('|') != -1 ) {
          let apps = appid.split("|")
          for (var i=0;i<apps.length;i++) {
            if( apps[i].indexOf('qq') == 0 ) {
              app = apps[i]
              break
            }
          }
        } else if( /^[\d|\.]*$/.test(appid) || appid.indexOf('qq') == 0 ) {
          app = appid
        }
        if(app) {
          if( typeof (path) != 'undefined' && path.length > 0 ) {
            qq.navigateToMiniProgram({
              appId: app.replace("qq-", ""),
              path: path
            })
          } else {
            qq.navigateToMiniProgram({
              appId: app.replace("qq-", "")
            })
          }
        } else {
          that.bindCopyLink(link)
        }
      } else if( type == 'webview' ) {
        qq.reLaunch({
          url: '/pages/view/view?url=' + link
        })
      } else if( type == 'document' ) {
        that.bindOpenDocument(link)
      } else if( type == 'page' && typeof (path) != 'undefined' && path.length > 0 ) {
        qq.reLaunch({
					url: path
				})
      } else {
        that.bindCopyLink(link)
      }
    } else {
      if( /\.(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(link) ) {
        qq.previewImage({
          current: link,
          urls: [link]
        })
      } else if(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf)$/.test(link)) {
        that.bindOpenDocument(link)
      } else if( link.indexOf(domain.replace("https", "")) != -1 ) {
        let slug = link.substring(link.lastIndexOf("/") + 1)
        let id = slug.substring(0, slug.lastIndexOf("."))
        if( slug.lastIndexOf(".") != -1 && /^[\d|\.]*$/.test(id) ) {
					qq.reLaunch({
						url: '/pages/detail/detail?id=' + id
					})
        } else {
          that.bindCopyLink(link)
        }
      } else {
        that.bindCopyLink(link)
      }
    }
  },

  bindLikeComment: function (e) {
		let that = this
		let id = e.currentTarget.id
		let index = e.currentTarget.dataset.index
		API.markComment({id:id}).then(res => {
			if (res.status == 200) {
				that.data.comments[index].islike = true
				that.data.comments[index].likes += 1
				that.setData({
					comments: that.data.comments
				})
			} else if (res.status == 202) {
				that.data.comments[index].islike = false
				that.data.comments[index].likes -= 1
				that.setData({
					comments: that.data.comments
				})
			}
		})
		.catch(err => {
			qq.showToast({
				title: err.message,
				duration: 1000
			})
		})
	},

  wxParseAudioPlay: function(e) {
    let audio = e.currentTarget.dataset.src
    if( !audio ) {
      qq.showToast({
        title: '获取音频错误',
      })
    } else {
      if( this.data.isPlaying && this.data.audio ) {
        if( this.data.audio == audio ) {
          this.audioCtx.pause()
          this.setData({
            isPlaying: false
          })
        } else {
          this.audioCtx.stop()
          this.audioCtx.src = audio
          this.audioCtx.play()
          this.setData({
            audio: audio,
            isPlaying: true
          })
        }
      } else {
        this.audioCtx.src = audio
        this.audioCtx.play()
        this.setData({
          audio: audio,
          isPlaying: true
        })
      }
    }
  },

  bindAudioPlay: function() {
    if( this.data.isPlaying ) {
      this.audioCtx.pause()
      this.setData({
        isPlaying: false
      })
    }
  }

})