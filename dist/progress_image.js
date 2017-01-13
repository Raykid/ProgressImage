/**
 * Created by Raykid on 2017/1/13.
 * 使用这个工具可以改变某个类的属性实现，包括js或者dom自建的类
 */
var utils;
(function (utils) {
    function changeProperty(obj, key, attrs) {
        var target = obj;
        while (true) {
            if (target == null)
                return obj;
            if (target.hasOwnProperty(key))
                break;
            // 如果是类型则要用prototype回溯，否则用__proto__回溯
            target = (typeof target == "function" ? target.prototype : target["__proto__"]);
        }
        // 记录下原始数据
        var oriAttrs = Object.getOwnPropertyDescriptor(target, key);
        // 开始篡改属性
        Object.defineProperty(target, key, attrs);
        // 插入一个$属性，用于获取原始属性
        Object.defineProperty(target, "$" + key, {
            configurable: oriAttrs.configurable,
            enumerable: oriAttrs.enumerable,
            get: function () {
                // 暂时恢复被篡改的方法
                Object.defineProperty(target, key, oriAttrs);
                // 调用原始属性
                var res = this[key];
                // 恢复成被篡改的状态
                Object.defineProperty(target, key, attrs);
                // 返回数据
                return res;
            },
            set: function (value) {
                // 暂时恢复被篡改的方法
                Object.defineProperty(target, key, oriAttrs);
                // 调用原始属性
                this[key] = value;
                // 恢复成被篡改的状态
                Object.defineProperty(target, key, attrs);
            }
        });
    }
    utils.changeProperty = changeProperty;
})(utils || (utils = {}));
/// <reference path="utils/ChangePropertyUtil.ts"/>
/**
 * Created by Raykid on 2017/1/11.
 * 引用该文件会对HTMLImageElement进行修改，增加progress事件的派发
 */
(function () {
    var waitXHR = [];
    function queueSendXHR(xhr) {
        if (waitXHR.indexOf(xhr) < 0) {
            waitXHR.push(xhr);
            xhr.addEventListener("abort", nextXHR);
            xhr.addEventListener("error", nextXHR);
            xhr.addEventListener("timeout", nextXHR);
            xhr.addEventListener("load", nextXHR);
            nextXHR.call(xhr);
        }
    }
    function nextXHR() {
        var xhr = this;
        if (waitXHR.indexOf(xhr) == 0) {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                xhr.removeEventListener("abort", nextXHR);
                xhr.removeEventListener("error", nextXHR);
                xhr.removeEventListener("timeout", nextXHR);
                xhr.removeEventListener("load", nextXHR);
                waitXHR.shift();
            }
            // 加载下一个
            xhr = waitXHR[0];
            if (xhr && xhr.readyState == XMLHttpRequest.OPENED) {
                xhr.send();
            }
        }
    }
    // 定义原型属性
    utils.changeProperty(HTMLImageElement, "src", {
        enumerable: true,
        configurable: true,
        get: function () {
            return this.__oriSrc;
        },
        set: function (value) {
            this.__oriSrc = value;
            var self = this;
            // 这里要判断一下是否是http请求，如果是则改用XMLHttpRequest去请求图片
            var protocol = value.substring(0, value.indexOf(":"));
            if (protocol == "http" || protocol == "https" || protocol == "") {
                if (this._xhr == null) {
                    // 还没初始化过，初始化
                    this._xhr = new XMLHttpRequest();
                    this._xhr.responseType = "arraybuffer";
                    this._xhr.addEventListener("abort", middleListener);
                    this._xhr.addEventListener("error", middleListener);
                    this._xhr.addEventListener("loadend", middleListener);
                    this._xhr.addEventListener("loadstart", middleListener);
                    this._xhr.addEventListener("progress", middleListener);
                    this._xhr.addEventListener("timeout", middleListener);
                    this._xhr.addEventListener("load", function () {
                        // load事件要单独处理，因为要解析二进制数据
                        var blob = new Blob([self._xhr.response]);
                        var url = URL.createObjectURL(blob);
                        // 开始真实加载
                        self.$src = url;
                        // 移除临时URL，必须推迟到下一帧进行，否则取不到url
                        setTimeout(URL.revokeObjectURL, 0, url);
                    });
                }
                // 改用XMLHttpRequest加载，然后触发progress事件
                if (this._xhr.status != XMLHttpRequest.UNSENT)
                    this._xhr.abort();
                this._xhr.open("GET", value, true);
                queueSendXHR(this._xhr);
            }
            else {
                // 非HTTP请求仍然使用基类提供的方法
                this.$src = value;
            }
            function middleListener(evt) {
                // 拷贝事件对象
                var newEvt = document.createEvent("Event");
                newEvt.initEvent(evt.type, evt.bubbles, evt.cancelable);
                newEvt.lengthComputable = evt.lengthComputable;
                newEvt.loaded = evt.loaded;
                newEvt.total = evt.total;
                // 转发事件
                self.dispatchEvent(newEvt);
            }
        }
    });
})();
//# sourceMappingURL=progress_image.js.map