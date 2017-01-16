/**
 * Created by Raykid on 2017/1/13.
 * 使用这个工具可以改变某个类的属性实现，包括js或者dom自建的类
 */
namespace utils
{
    var _oriAttrsDict:{[key:string]:PropertyDescriptor} = {};

    function getTarget(obj:any, key:string):any
    {
        var target:any = obj;
        while(true)
        {
            if(target == null) return obj;
            if(target.hasOwnProperty(key)) break;
            // 如果是类型则要用prototype回溯，否则用__proto__回溯
            target = (typeof target == "function" ? target.prototype : target["__proto__"]);
        }
        return target;
    }

    export function changeProperty(obj:any, key:string, attrs:PropertyDescriptor):any
    {
        var target:any = getTarget(obj, key);
        // 记录下原始数据
        var oriAttrs:PropertyDescriptor = Object.getOwnPropertyDescriptor(target, key);
        _oriAttrsDict[target.constructor.name + "_" + key] = oriAttrs;
        // 开始篡改属性
        Object.defineProperty(target, key, attrs);
        // 插入一个$属性，用于获取原始属性
        Object.defineProperty(target, "$" + key, {
            configurable: oriAttrs.configurable,
            enumerable: oriAttrs.enumerable,
            get: function():any
            {
                // 暂时恢复被篡改的方法
                Object.defineProperty(target, key, oriAttrs);
                // 调用原始属性
                var res:any = this[key];
                // 恢复成被篡改的状态
                Object.defineProperty(target, key, attrs);
                // 返回数据
                return res;
            },
            set: function(value:any):void
            {
                // 暂时恢复被篡改的方法
                Object.defineProperty(target, key, oriAttrs);
                // 调用原始属性
                this[key] = value;
                // 恢复成被篡改的状态
                Object.defineProperty(target, key, attrs);
            }
        });
    }

    export function recoverProperty(obj:any, key:string):any
    {
        var target:any = getTarget(obj, key);
        // 取出原始数据
        var tempKey:string = target.constructor.name + "_" + key;
        var oriAttrs:PropertyDescriptor = _oriAttrsDict[tempKey];
        delete _oriAttrsDict[tempKey];
        if(oriAttrs == null) return obj;
        // 恢复被篡改的属性
        Object.defineProperty(target, key, oriAttrs);
        // 移除$属性
        delete target["$" + key];
        // 返回
        return obj;
    }
}