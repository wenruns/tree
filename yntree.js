(function (window, undefined) {
    var count = 0, inputCount = 0, ynTrees = {}, classNameCfg = {spread: "spread", shrink: "shrink"},
        uniqueFlag = Math.ceil(Math.random() * 100) + '-' + (new Date()).valueOf(), loadCss = true;

    /**
     * 树状结构复选框功能
     *
     * @param ele                   树状结构挂载元素
     *
     * @param options               参数
     *
     * @constructor
     */
    function YnTree({
                        ele,
                        onchange = null,             // 复选看发送变化事件
                        checkStrictly = true,        // 是否父子互相关联，默认true
                        data = [],                   // 树状结构数据集
                        hideCheckBox = false,    //是否隐藏复选框
                        spread = false,          //是否默认展开树状结构
                        spreadChecked = true,    // 是否默认展开选中的树状结构
                    }) {
        if (!ele || !ele.nodeName || ele.nodeType != 1) {
            throw"YnTree 第一个参数必须是一个元素！"
        }
        this.ele = ele;

        this.options = {
            onchange,
            checkStrictly,
            data,
            configs: {
                hideCheckBox,
                spread,
                spreadChecked,
            }
        };

        !this.options.data ? (this.options.data = []) : "";
        if (YnTree.getType(this.options.data) == "object") {
            this.options.data = [this.options.data]
        }
        this.data = [];
        this.parallel = [];
        this.id = "yn_tree" + (++count) + "_" + uniqueFlag;
        this.tree = YnTree.createDomByString('<ul class="yn-tree" id="' + this.id + '"></ul>');
        this._init()
        // console.log(this._init());
    }

    /**
     * 初始化
     * @returns {YnTree}
     * @private
     */
    YnTree.prototype._init = function () {
        var that = this;
        if (this.options.data.length > 0) {
            this._copyData(this.options.data, this.data);
            this._createDom(this.data);
            this._assemblyDom(this.tree, this.data)
        }
        this.ele.appendChild(this.tree);
        ynTrees[this.id] = this;
        loadCssFunc();
        return this
    };
    YnTree.prototype.version = "1.0.0";

    YnTree.prototype._copyData = function (data, parent) {
        var that = this;
        data = data || that.options.data;
        YnTree.getType(data) != "array" ? (data = [data]) : "";
        YnTree.forEach(data, function (index, item) {
            if (item.sub) {
                var obj = new CompositeLeaf(item, "composite", that.id);
                parent.push(obj);
                that.parallel.push(obj);
                that._copyData(item.sub, obj.sub)
            } else {
                var obj = new CompositeLeaf(item, "leaf", that.id);
                parent.push(obj);
                that.parallel.push(obj)
            }
        });
        return this
    };
    YnTree.prototype._createDom = function (data, parent) {
        var that = this;
        var spread = this.options.configs.spread;
        var spreadChecked = this.options.configs.spreadChecked;
        var hideCheckBox = this.options.configs.hideCheckBox;
        YnTree.forEach(data, function (index, item) {
            var html = "", id = "yn_tree_input" + ++inputCount + '_' + uniqueFlag, nameVal = item.name ? item.name : "",
                val = item.value ? item.value : "", checked = item.checked ? item.checked : false,
                disabled = item.disabled ? item.disabled : false, className = item.className ? item.className : "";
            var spreadOrShrink = spread ? (item.sub && item.sub.length ? 'spread' : 'shrink') : (spreadChecked ? (checked ? (item.sub && item.sub.length ? 'spread' : 'shrink') : 'shrink') : 'shrink');
            html += '<li class="yn-tree-li ' + spreadOrShrink + '" id="' + id + '_li" ' + (parent ? 'pid="' + parent.id + '"' : "") + ">";
            html += '	<div class="checkbox">';
            if (item.sub && item.sub.length) {
                html += '<span class="arrow arrow-right"></span>'
            } else {
                html += '<span class="no-arrow"></span>'
            }
            html += "		<label>";
            html += '<span class="text">' + item.text + "</span>" + '			<input type="' + (hideCheckBox ? 'hidden' : 'checkbox') + '" class="yn-tree-input ' + className + '" id="' + id + '" ' + (checked ? 'checked="checked"' : "") + (disabled ? 'disabled="disabled"' : "") + (parent && parent.id ? ' pid="' + parent.id + '"' : "") + ' name="' + nameVal + '[]" value="' + val + '">';
            html += "		</label>";
            html += "	</div>";
            if (item.sub && item.sub.length) {
                html += '<ul class="yn-tree"></ul>';
                item.type = "composite"
            } else {
                item.type = "leaf"
            }
            html += "</li>";

            item.id = id;
            item.pid = parent ? parent.id : null;
            item.dom = YnTree.createDomByString(html);
            bindChangeEvent(item.dom.querySelector(".yn-tree-input"), item);
            if (item.sub && item.sub.length) {
                arrowBindClickEvent(item.dom.querySelector(".arrow-right"), item);
                that._createDom(item.sub, item)
            }
        });
        return this
    };
    YnTree.prototype._assemblyDom = function (parent, data) {
        var that = this;
        if (!parent && !data) {
            return this
        }
        YnTree.getType(data) != "array" ? (data = [data]) : data;
        YnTree.forEach(data, function (index, item) {
            parent.appendChild(item.dom);
            if (item.sub && item.sub.length) {
                that._assemblyDom(item.dom.querySelector(".yn-tree"), item.sub)
            }
        });
        return this
    };
    YnTree.prototype.select = function (condition, flag, {up = true, down = true} = {}) {
        var that = this, dataItem = null;
        YnTree.forEach(that.parallel, function (index, item) {
            var curInput = document.getElementById(item.id);
            if (condition === item.id || condition === item.text || condition === item.value || condition === curInput) {
                dataItem = item;
                return false
            }
        });
        if (dataItem) {
            dataItem.select(flag, {down, up});
        }
        return this
    };
    YnTree.prototype.disable = function (condition, flag) {
        var that = this, dataItem = null;
        YnTree.forEach(that.parallel, function (index, item) {
            var curInput = document.getElementById(item.id);
            if (condition === item.id || condition === item.text || condition === item.value || condition === curInput) {
                dataItem = item;
                return false
            }
        });
        dataItem.disable(flag);
        return this
    };
    YnTree.prototype.getCheckedInputs = function () {
        var that = this, checkedInput = [];
        YnTree.forEach(that.parallel, function (index, item) {
            if (item.checked) {
                checkedInput.push(document.getElementById(item.id))
            }
        });
        return checkedInput
    };
    YnTree.prototype.getValues = function () {
        var that = this, checkedVals = [];
        YnTree.forEach(that.getCheckedInputs(), function (index, item) {
            checkedVals.push(item.value)
        });
        return checkedVals
    };
    YnTree.prototype.reInit = function (data) {
        var that = this;
        if (data && YnTree.getType(data) == "array") {
            this.options.data = data
        }
        if (this.options.data.length > 0) {
            this.ele.removeChild(this.tree);
            this.tree = YnTree.createDomByString('<ul class="yn-tree" id="' + this.id + '"></ul>');
            this.data = [];
            this._copyData(this.options.data, this.data);
            this._createDom(this.data);
            this._assemblyDom(this.tree, this.data);
            this.ele.appendChild(this.tree)
        }
        console.log("重新初始化");
        return this
    };
    YnTree.prototype.destroy = function () {
        this.ele.removeChild(this.tree);
        this.options = null;
        this.parallel = null;
        this.tree = null;
        this.id = null;
        this.data = null;
        this.ele = null;
        console.info("YnTree销毁完毕，建议您将YnTree的实例置为null，如：\r\n var ynTree = new YnTree(...);\r\n ynTree.destroy();\r\n ynTree = null;")
    };
    YnTree.prototype.spread = function (condition, flag) {
        var that = this, dataItem = null;
        YnTree.forEach(that.parallel, function (index, item) {
            var curInput = document.getElementById(item.id);
            if (condition === item.id || condition === item.text || condition === curInput) {
                dataItem = item;
                return false
            }
        });
        if (dataItem.type == "leaf") {
            return this
        }
        dataItem.spread(flag);
        return this
    };
    YnTree.createDomByString = function (htmlStr) {
        var ele = document.createElement("div"), dom;
        ele.innerHTML = htmlStr;
        dom = ele.children;
        ele = null;
        return dom[0]
    };
    YnTree.getType = function (data) {
        var type = Object.prototype.toString.call(data);
        return type.replace("[", "").replace("]", "").split(" ")[1].toLowerCase()
    };
    YnTree.forEach = function (arr, fn) {
        if (YnTree.getType(arr) != "array") {
            return arr
        }
        for (var i = 0, len = arr.length; i < len; i++) {
            var val = fn.call(arr[i], i, arr[i]);
            if (val === false) {
                break
            }
        }
        return arr
    };
    YnTree.on = function (ele, type, fn) {
        if (document.addEventListener) {
            ele.addEventListener(type, fn, false)
        } else {
            if (window.attachEvent) {
                if (!ele["_" + type + "_event"]) {
                    var arr = [fn];
                    ele["_" + type + "_event"] = arr
                } else {
                    ele["_" + type + "_event"].push(fn)
                }
                ele.attachEvent("on" + type, function () {
                    var e = window.event;
                    e.preventDefault = function () {
                        e.returnValue = false
                    };
                    e.stopPropagation = function () {
                        e.calcleBubble = true
                    };
                    e.target = e.srcElement;
                    fn.call(ele, e)
                })
            }
        }
        return ele
    };
    YnTree.extend = function (target, obj) {
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                target[attr] = obj[attr]
            }
        }
        return target
    };


    function loadCssFunc() {
        if (loadCss) {
            try {
                Array.from(document.querySelectorAll('script')).forEach(function (item) {
                    if (item.src && item.src.indexOf('yntree.js') >= 0) {
                        var url = item.src.replace('yntree.js', 'yntree.min.css');
                        var link = document.createElement("link");
                        var head = document.getElementsByTagName("head")[0];
                        link.rel = "stylesheet";
                        link.type = "text/css";
                        link.href = url;
                        head.appendChild(link);
                        loadCss = false;
                        throw new Error('ok');
                    }
                });
                throw new Error('加载css失败，您可以手动加载css');
            } catch (e) {
                if (e.message != 'ok') {
                    throw new Error(e);
                }
            }
        }
    }

    function bindChangeEvent(input, currentData) {
        YnTree.on(input, "change", function (e) {
            var curInput = e.target;
            currentData.select(curInput.checked, {up: curInput.checked})
        })
    }

    function arrowBindClickEvent(arrowEle, currentData) {
        YnTree.on(arrowEle, "click", function (e) {
            currentData.spread()
        })
    }

    function CompositeLeaf(options, type, ynTreeId) {
        this.type = type || "";
        YnTree.extend(this, options || {});
        if (this.sub) {
            this.sub = []
        }
        this.ynTreeId = ynTreeId
    }

    CompositeLeaf.prototype = {
        constructor: CompositeLeaf, selectDown: function (flag, {
            spread = false,
            spreadChecked = true,
        }) {
            var that = this;
            flag = !!flag;
            if (that.sub && that.sub.length) {
                YnTree.forEach(that.sub, function (index, item) {
                    if (!item.disabled) {
                        item.checked = flag;
                        item.dom.querySelector(".yn-tree-input").checked = flag
                        if (flag && spreadChecked) {
                            item.dom.classList.remove('shrink');
                            item.dom.classList.add('spread');
                        } else if (!flag && !spread) {
                            item.dom.classList.remove('spread');
                            item.dom.classList.add('shrink');
                        }
                    }
                    if (item.sub) {
                        YnTree.forEach(item.sub, arguments.callee)
                    }
                })
            }
            return this
        }, selectUp: function (flag) {
            var that = this, parent = null;
            flag = !!flag;
            if (!this.pid) {
                return this
            }
            YnTree.forEach(that.getYnTree(that.ynTreeId).parallel, function (index, item) {
                if (item.id === that.pid) {
                    parent = item;
                    return false
                }
            });
            if (flag) {
                parent.checked = flag;
                document.getElementById(parent.id).checked = flag
            } else {
                var allChildNotChecked = true;
                YnTree.forEach(parent.sub, function (index, item) {
                    if (item.checked) {
                        allChildNotChecked = false;
                        return false
                    }
                });
                if (allChildNotChecked) {
                    parent.checked = flag;
                    document.getElementById(parent.id).checked = flag
                }
            }
            if (parent.pid) {
                parent.selectUp(flag)
            }
            return this
        }, select: function (flag, {down = true, up = true}) {
            var that = this, input = document.getElementById(that.id), ynTree = this.getYnTree(this.ynTreeId),
                spreadChecked = ynTree.options.configs.spreadChecked, spread = ynTree.options.configs.spread;
            flag = !!flag;
            if (!that.disabled) {
                that.checked = flag;
                input.checked = flag
            }
            ynTree.options.onchange && YnTree.getType(ynTree.options.onchange) == "function" && ynTree.options.onchange.call(this, input, ynTree);

            if (typeof ynTree.options.checkStrictly == "undefined" || ynTree.options.checkStrictly === true) {
                if (that.type == "composite" && down) {
                    this.selectDown(flag, {
                        spreadChecked,
                        spread,
                    })
                }
                if (that.pid && up) {
                    this.selectUp(flag)
                }
            }
            // 展开选中选项
            if (this.dom.childNodes[2]) {
                if (flag && spreadChecked) {
                    this.dom.classList.add('spread');
                    this.dom.classList.remove('shrink');
                } else if (!flag && !spread) {
                    this.dom.classList.remove('spread');
                    this.dom.classList.add('shrink');
                }
            }

            return this
        }, disable: function (flag) {
            var that = this, input = document.getElementById(that.id), ynTree = this.getYnTree(this.ynTreeId);
            flag = !!flag;
            that.disabled = flag;
            input.disabled = flag;
            return this
        }, getYnTree: function (id) {
            var ynTree;
            if (id in ynTrees) {
                ynTree = ynTrees[id]
            }
            return ynTree
        }, spread: function (flag) {
            var that = this, curLi = document.getElementById(that.id + "_li"), ynTree = this.getYnTree(this.ynTreeId),
                classNameArr = curLi.className.split(" "), hasSpreadClass = false, spreadClassIndex = -1,
                hasShrinkClass = false, shrinkClassIndex = -1;

            if (that.type == "leaf") {
                return this
            }
            for (var i = 0, len = classNameArr.length; i < len; i++) {
                if (classNameArr[i] === classNameCfg.spread) {
                    hasSpreadClass = true;
                    spreadClassIndex = i
                }
                if (classNameArr[i] === classNameCfg.shrink) {
                    hasShrinkClass = true;
                    shrinkClassIndex = i
                }
            }
            if (typeof flag == "undefined") {
                if (hasSpreadClass) {
                    flag = false
                } else {
                    if (hasShrinkClass) {
                        flag = true
                    }
                }
            }
            flag = !!flag;
            if (flag) {
                if (hasSpreadClass) {
                    return this
                }
                if (hasShrinkClass) {
                    classNameArr.splice(shrinkClassIndex, 1)
                }
                classNameArr.push(classNameCfg.spread);
                curLi.className = classNameArr.join(" ")
            } else {
                if (hasShrinkClass) {
                    return this
                }
                if (hasSpreadClass) {
                    classNameArr.splice(spreadClassIndex, 1)
                }
                classNameArr.push(classNameCfg.shrink);
                curLi.className = classNameArr.join(" ")
            }
            return this
        },
    };
    window.YnTree = YnTree
})(window, undefined);