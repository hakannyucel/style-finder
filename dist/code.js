(()=>{"use strict";({383:function(){var t=this&&this.__awaiter||function(t,e,n,i){return new(n||(n=Promise))((function(o,r){function s(t){try{c(i.next(t))}catch(t){r(t)}}function a(t){try{c(i.throw(t))}catch(t){r(t)}}function c(t){var e;t.done?o(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(s,a)}c((i=i.apply(t,e||[])).next())}))};figma.showUI(__html__,{width:400,height:295}),figma.ui.onmessage=e=>t(void 0,void 0,void 0,(function*(){if("extract"===e.type){const t=e.url||"";try{const e=yield fetch(t),n=yield e.text(),i=/#(?:[0-9a-fA-F]{3}){1,2}\b/g,o=n.match(i)||[],r=/font-family\s*:\s*([^;"}]+)/gi,s=/font-size\s*:\s*([^;"}]+)/gi;let a,c=[],f=[];for(;null!==(a=r.exec(n));)c.push(a[1].trim());for(;null!==(a=s.exec(n));)f.push(a[1].trim());const u={colors:Array.from(new Set(o)),fonts:Array.from(new Set(c)),fontSizes:Array.from(new Set(f))};figma.ui.postMessage({type:"result",data:u})}catch(t){const e=t instanceof Error?t.message:String(t);figma.ui.postMessage({type:"error",message:e})}}}))}})[383]()})();