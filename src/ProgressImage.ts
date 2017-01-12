/**
 * Created by Raykid on 2017/1/11.
 * 引用该文件会对HTMLImageElement进行修改，增加progress事件的派发
 */
(function():void
{
    // 替换document.createElement方法，使其在参数为img时生成Image而不是HTMLImageElement
    var temp:Function = document.createElement;
    document.createElement = function(tagName:string):HTMLElement
    {
        if(tagName == "img") return new Image();
        return temp.call(this, tagName);
    };
    // 生成getter方法
    var getter:()=>string = function():string{return this.__oriSrc};
    var setter:(value:string)=>void = function(value:string):void
    {
        this.__oriSrc = value;
        var self:any = this;
        // 这里要判断一下是否是http请求，如果是则改用XMLHttpRequest去请求图片
        var protocol:string = value.substring(0, value.indexOf(":"));
        if(protocol == "http" || protocol == "https" || protocol == "")
        {
            if(this._xhr == null)
            {
                // 还没初始化过，初始化
                this._xhr = new XMLHttpRequest();
                this._xhr.responseType = "arraybuffer";
                this._xhr.onabort = middleListener;
                this._xhr.onerror = middleListener;
                this._xhr.onloadend = middleListener;
                this._xhr.onloadstart = middleListener;
                this._xhr.onprogress = middleListener;
                this._xhr.ontimeout = middleListener;
                this._xhr.onload = function():void
                {
                    // load事件要单独处理，因为要解析二进制数据
                    var blob:Blob = new Blob([self._xhr.response]);
                    var url:string = URL.createObjectURL(blob);
                    // 开始真实加载
                    callOri(url);
                    // 移除临时URL，必须推迟到下一帧进行，否则取不到url
                    setTimeout(URL.revokeObjectURL, 0, url);
                };
            }
            // 改用XMLHttpRequest加载，然后出发progress事件
            if(this._xhr.status != XMLHttpRequest.UNSENT) this._xhr.abort();
            this._xhr.open("GET", value, true);
            this._xhr.send();
        }
        else
        {
            // 非HTTP请求仍然使用基类提供的方法
            callOri(value);
        }

        function middleListener(evt:Event):void
        {
            // 拷贝事件对象
            var newEvt:Event = document.createEvent(evt.constructor["name"]);
            newEvt.initEvent(evt.type, evt.bubbles, evt.cancelable);
            var keys:string[] = Object.keys(evt["__proto__"]);
            for(var i in keys)
            {
                var key:string = keys[i];
                Object.defineProperty(newEvt, key, {
                    writable: false,
                    value: evt[key]
                });
            }
            // 转发事件
            var callback:(evt:Event)=>void = self["on" + newEvt.type];
            callback && callback.call(self, newEvt);
            self.dispatchEvent(newEvt);
        }

        function callOri(value:string):void
        {
            // 暂时删除Image的原型src属性，因为我们要调用原始的src定义
            delete Image.prototype["src"];
            // 调用原始的src属性
            self.src = value;
            // 调用完了，恢复src的篡改定义
            Object.defineProperty(Image.prototype, "src", {
                configurable: true,
                get: getter,
                set: setter
            });
        }
    };
    // 定义原型属性
    Object.defineProperty(Image.prototype, "src", {
        configurable: true,
        get: getter,
        set: setter
    });
})();