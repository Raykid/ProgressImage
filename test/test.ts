/// <reference path="../src/ProgressImage.ts"/>

/**
 * Created by Raykid on 2016/12/23.
 */
window.onload = ()=>
{
    // 这里可以生成包装好的Image
    var img:HTMLImageElement = document.createElement("img");
    img.src = "test.jpg";
    img.onprogress = (evt:ProgressEvent)=>{
        if(evt.lengthComputable)
        {
            console.log(evt.loaded / evt.total);
        }
    };
    document.body.appendChild(img);
    // 这里可以生成其他标签
    var div:HTMLDivElement = document.createElement("div");
    div.innerText = "fuck";
    document.body.appendChild(div);
};