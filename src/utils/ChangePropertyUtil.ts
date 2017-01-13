/**
 * Created by Raykid on 2017/1/13.
 * 使用这个工具可以改变某个类的属性实现，包括js或者dom自建的类
 */
namespace utils
{
    export function changeProperty(obj:any, key:string, attrs:PropertyDescriptor):any
    {
        var target:any = obj;
        while(true)
        {
            if(target == null) return obj;
            if(target.hasOwnProperty(key)) break;
            // 如果是类型则要用prototype回溯，否则用__proto__回溯
            target = (typeof target == "function" ? target.prototype : target["__proto__"]);
        }
        // 记录下原始数据
        var oriAttrs:PropertyDescriptor = Object.getOwnPropertyDescriptor(target, key);
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
}