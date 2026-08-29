'use strict';

var react = require('react');
var ReactNative = require('react-native');
var expoFileSystem = require('expo-file-system');
var ExpoLinking = require('expo-linking');
var Sharing = require('expo-sharing');
var expoAudio = require('expo-audio');
var Ionicons = require('@expo/vector-icons/Ionicons');
var FontAwesome6 = require('@expo/vector-icons/FontAwesome6');
var reactNativeWebview = require('react-native-webview');
var jsxRuntime = require('react/jsx-runtime');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var ReactNative__namespace = /*#__PURE__*/_interopNamespace(ReactNative);
var ExpoLinking__namespace = /*#__PURE__*/_interopNamespace(ExpoLinking);
var Sharing__namespace = /*#__PURE__*/_interopNamespace(Sharing);
var Ionicons__default = /*#__PURE__*/_interopDefault(Ionicons);
var FontAwesome6__default = /*#__PURE__*/_interopDefault(FontAwesome6);

// src/react/native/PdfDocumentViewer.tsx

// src/react/native/assets/pageFlipBrowserScript.ts
var PAGE_FLIP_BROWSER_SCRIPT = '!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t=t||self).St={})}(this,(function(t){"use strict";class e{constructor(t,e){this.state={angle:0,area:[],position:{x:0,y:0},hardAngle:0,hardDrawingAngle:0},this.createdDensity=e,this.nowDrawingDensity=this.createdDensity,this.render=t}setDensity(t){this.createdDensity=t,this.nowDrawingDensity=t}setDrawingDensity(t){this.nowDrawingDensity=t}setPosition(t){this.state.position=t}setAngle(t){this.state.angle=t}setArea(t){this.state.area=t}setHardDrawingAngle(t){this.state.hardDrawingAngle=t}setHardAngle(t){this.state.hardAngle=t,this.state.hardDrawingAngle=t}setOrientation(t){this.orientation=t}getDrawingDensity(){return this.nowDrawingDensity}getDensity(){return this.createdDensity}getHardAngle(){return this.state.hardAngle}}class i extends e{constructor(t,e,i){super(t,i),this.image=null,this.isLoad=!1,this.loadingAngle=0,this.image=new Image,this.image.src=e}draw(t){const e=this.render.getContext(),i=this.render.convertToGlobal(this.state.position),s=this.render.getRect().pageWidth,n=this.render.getRect().height;e.save(),e.translate(i.x,i.y),e.beginPath();for(let t of this.state.area)null!==t&&(t=this.render.convertToGlobal(t),e.lineTo(t.x-i.x,t.y-i.y));e.rotate(this.state.angle),e.clip(),this.isLoad?e.drawImage(this.image,0,0,s,n):this.drawLoader(e,{x:0,y:0},s,n),e.restore()}simpleDraw(t){const e=this.render.getRect(),i=this.render.getContext(),s=e.pageWidth,n=e.height,h=1===t?e.left+e.pageWidth:e.left,r=e.top;this.isLoad?i.drawImage(this.image,h,r,s,n):this.drawLoader(i,{x:h,y:r},s,n)}drawLoader(t,e,i,s){t.beginPath(),t.strokeStyle="rgb(200, 200, 200)",t.fillStyle="rgb(255, 255, 255)",t.lineWidth=1,t.rect(e.x+1,e.y+1,i-1,s-1),t.stroke(),t.fill();const n={x:e.x+i/2,y:e.y+s/2};t.beginPath(),t.lineWidth=10,t.arc(n.x,n.y,20,this.loadingAngle,3*Math.PI/2+this.loadingAngle),t.stroke(),t.closePath(),this.loadingAngle+=.07,this.loadingAngle>=2*Math.PI&&(this.loadingAngle=0)}load(){this.isLoad||(this.image.onload=()=>{this.isLoad=!0})}newTemporaryCopy(){return this}getTemporaryCopy(){return this}hideTemporaryCopy(){}}class s{constructor(t,e){this.pages=[],this.currentPageIndex=0,this.currentSpreadIndex=0,this.landscapeSpread=[],this.portraitSpread=[],this.render=e,this.app=t,this.currentPageIndex=0,this.isShowCover=this.app.getSettings().showCover}destroy(){this.pages=[]}createSpread(){this.landscapeSpread=[],this.portraitSpread=[];for(let t=0;t<this.pages.length;t++)this.portraitSpread.push([t]);let t=0;this.isShowCover&&(this.pages[0].setDensity("hard"),this.landscapeSpread.push([t]),t++);for(let e=t;e<this.pages.length;e+=2)e<this.pages.length-1?this.landscapeSpread.push([e,e+1]):(this.landscapeSpread.push([e]),this.pages[e].setDensity("hard"))}getSpread(){return"landscape"===this.render.getOrientation()?this.landscapeSpread:this.portraitSpread}getSpreadIndexByPage(t){const e=this.getSpread();for(let i=0;i<e.length;i++)if(t===e[i][0]||t===e[i][1])return i;return null}getPageCount(){return this.pages.length}getPages(){return this.pages}getPage(t){if(t>=0&&t<this.pages.length)return this.pages[t];throw new Error("Invalid page number")}nextBy(t){const e=this.pages.indexOf(t);return e<this.pages.length-1?this.pages[e+1]:null}prevBy(t){const e=this.pages.indexOf(t);return e>0?this.pages[e-1]:null}getFlippingPage(t){const e=this.currentSpreadIndex;if("portrait"===this.render.getOrientation())return 0===t?this.pages[e].newTemporaryCopy():this.pages[e-1];{const i=0===t?this.getSpread()[e+1]:this.getSpread()[e-1];return 1===i.length||0===t?this.pages[i[0]]:this.pages[i[1]]}}getBottomPage(t){const e=this.currentSpreadIndex;if("portrait"===this.render.getOrientation())return 0===t?this.pages[e+1]:this.pages[e-1];{const i=0===t?this.getSpread()[e+1]:this.getSpread()[e-1];return 1===i.length?this.pages[i[0]]:0===t?this.pages[i[1]]:this.pages[i[0]]}}showNext(){this.currentSpreadIndex<this.getSpread().length&&(this.currentSpreadIndex++,this.showSpread())}showPrev(){this.currentSpreadIndex>0&&(this.currentSpreadIndex--,this.showSpread())}getCurrentPageIndex(){return this.currentPageIndex}show(t=null){if(null===t&&(t=this.currentPageIndex),t<0||t>=this.pages.length)return;const e=this.getSpreadIndexByPage(t);null!==e&&(this.currentSpreadIndex=e,this.showSpread())}getCurrentSpreadIndex(){return this.currentSpreadIndex}setCurrentSpreadIndex(t){if(!(t>=0&&t<this.getSpread().length))throw new Error("Invalid page");this.currentSpreadIndex=t}showSpread(){const t=this.getSpread()[this.currentSpreadIndex];2===t.length?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(this.pages[t[1]])):"landscape"===this.render.getOrientation()&&t[0]===this.pages.length-1?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(null)):(this.render.setLeftPage(null),this.render.setRightPage(this.pages[t[0]])),this.currentPageIndex=t[0],this.app.updatePageIndex(this.currentPageIndex)}}class n extends s{constructor(t,e,i){super(t,e),this.imagesHref=i}load(){for(const t of this.imagesHref){const e=new i(this.render,t,"soft");e.load(),this.pages.push(e)}this.createSpread()}}class h{static GetDistanceBetweenTwoPoint(t,e){return null===t||null===e?1/0:Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))}static GetSegmentLength(t){return h.GetDistanceBetweenTwoPoint(t[0],t[1])}static GetAngleBetweenTwoLine(t,e){const i=t[0].y-t[1].y,s=e[0].y-e[1].y,n=t[1].x-t[0].x,h=e[1].x-e[0].x;return Math.acos((i*s+n*h)/(Math.sqrt(i*i+n*n)*Math.sqrt(s*s+h*h)))}static PointInRect(t,e){return null===e?null:e.x>=t.left&&e.x<=t.width+t.left&&e.y>=t.top&&e.y<=t.top+t.height?e:null}static GetRotatedPoint(t,e,i){return{x:t.x*Math.cos(i)+t.y*Math.sin(i)+e.x,y:t.y*Math.cos(i)-t.x*Math.sin(i)+e.y}}static LimitPointToCircle(t,e,i){if(h.GetDistanceBetweenTwoPoint(t,i)<=e)return i;const s=t.x,n=t.y,r=i.x,o=i.y;let a=Math.sqrt(Math.pow(e,2)*Math.pow(s-r,2)/(Math.pow(s-r,2)+Math.pow(n-o,2)))+s;i.x<0&&(a*=-1);let g=(a-s)*(n-o)/(s-r)+n;return s-r+n===0&&(g=e),{x:a,y:g}}static GetIntersectBetweenTwoSegment(t,e,i){return h.PointInRect(t,h.GetIntersectBeetwenTwoLine(e,i))}static GetIntersectBeetwenTwoLine(t,e){const i=t[0].y-t[1].y,s=e[0].y-e[1].y,n=t[1].x-t[0].x,h=e[1].x-e[0].x,r=t[0].x*t[1].y-t[1].x*t[0].y,o=e[0].x*e[1].y-e[1].x*e[0].y,a=i*o-s*r,g=n*o-h*r,l=-(r*h-o*n)/(i*h-s*n),d=-(i*o-s*r)/(i*h-s*n);if(isFinite(l)&&isFinite(d))return{x:l,y:d};if(Math.abs(a-g)<.1)throw new Error("Segment included");return null}static GetCordsFromTwoPoint(t,e){const i=Math.abs(t.x-e.x),s=Math.abs(t.y-e.y),n=Math.max(i,s),h=[t];function r(t,e,i,s,n){return e>t?t+n*(i/s):e<t?t-n*(i/s):t}for(let o=1;o<=n;o+=1)h.push({x:r(t.x,e.x,i,n,o),y:r(t.y,e.y,s,n,o)});return h}}class r extends e{constructor(t,e,i){super(t,i),this.copiedElement=null,this.temporaryCopy=null,this.isLoad=!1,this.element=e,this.element.classList.add("stf__item"),this.element.classList.add("--"+i)}newTemporaryCopy(){return"hard"===this.nowDrawingDensity?this:(null===this.temporaryCopy&&(this.copiedElement=this.element.cloneNode(!0),this.element.parentElement.appendChild(this.copiedElement),this.temporaryCopy=new r(this.render,this.copiedElement,this.nowDrawingDensity)),this.getTemporaryCopy())}getTemporaryCopy(){return this.temporaryCopy}hideTemporaryCopy(){null!==this.temporaryCopy&&(this.copiedElement.remove(),this.copiedElement=null,this.temporaryCopy=null)}draw(t){const e=t||this.nowDrawingDensity,i=this.render.convertToGlobal(this.state.position),s=this.render.getRect().pageWidth,n=this.render.getRect().height;this.element.classList.remove("--simple");const h=`\\n            display: block;\\n            z-index: ${this.element.style.zIndex};\\n            left: 0;\\n            top: 0;\\n            width: ${s}px;\\n            height: ${n}px;\\n        `;"hard"===e?this.drawHard(h):this.drawSoft(i,h)}drawHard(t=""){const e=this.render.getRect().left+this.render.getRect().width/2,i=this.state.hardDrawingAngle,s=t+"\\n                backface-visibility: hidden;\\n                -webkit-backface-visibility: hidden;\\n                clip-path: none;\\n                -webkit-clip-path: none;\\n            "+(0===this.orientation?`transform-origin: ${this.render.getRect().pageWidth}px 0; \\n                   transform: translate3d(0, 0, 0) rotateY(${i}deg);`:`transform-origin: 0 0; \\n                   transform: translate3d(${e}px, 0, 0) rotateY(${i}deg);`);this.element.style.cssText=s}drawSoft(t,e=""){let i="polygon( ";for(const t of this.state.area)if(null!==t){let e=1===this.render.getDirection()?{x:-t.x+this.state.position.x,y:t.y-this.state.position.y}:{x:t.x-this.state.position.x,y:t.y-this.state.position.y};e=h.GetRotatedPoint(e,{x:0,y:0},this.state.angle),i+=e.x+"px "+e.y+"px, "}i=i.slice(0,-2),i+=")";const s=e+`transform-origin: 0 0; clip-path: ${i}; -webkit-clip-path: ${i};`+(this.render.isSafari()&&0===this.state.angle?`transform: translate(${t.x}px, ${t.y}px);`:`transform: translate3d(${t.x}px, ${t.y}px, 0) rotate(${this.state.angle}rad);`);this.element.style.cssText=s}simpleDraw(t){const e=this.render.getRect(),i=e.pageWidth,s=e.height,n=1===t?e.left+e.pageWidth:e.left,h=e.top;this.element.classList.add("--simple"),this.element.style.cssText=`\\n            position: absolute; \\n            display: block; \\n            height: ${s}px; \\n            left: ${n}px; \\n            top: ${h}px; \\n            width: ${i}px; \\n            z-index: ${this.render.getSettings().startZIndex+1};`}getElement(){return this.element}load(){this.isLoad=!0}setOrientation(t){super.setOrientation(t),this.element.classList.remove("--left","--right"),this.element.classList.add(1===t?"--right":"--left")}setDrawingDensity(t){this.element.classList.remove("--soft","--hard"),this.element.classList.add("--"+t),super.setDrawingDensity(t)}}class o extends s{constructor(t,e,i,s){super(t,e),this.element=i,this.pagesElement=s}load(){for(const t of this.pagesElement){const e=new r(this.render,t,"hard"===t.dataset.density?"hard":"soft");e.load(),this.pages.push(e)}this.createSpread()}}class a{constructor(t,e,i,s){this.direction=t,this.corner=e,this.topIntersectPoint=null,this.sideIntersectPoint=null,this.bottomIntersectPoint=null,this.pageWidth=parseInt(i,10),this.pageHeight=parseInt(s,10)}calc(t){try{return this.position=this.calcAngleAndPosition(t),this.calculateIntersectPoint(this.position),!0}catch(t){return!1}}getFlippingClipArea(){const t=[];let e=!1;return t.push(this.rect.topLeft),t.push(this.topIntersectPoint),null===this.sideIntersectPoint?e=!0:(t.push(this.sideIntersectPoint),null===this.bottomIntersectPoint&&(e=!1)),t.push(this.bottomIntersectPoint),(e||"bottom"===this.corner)&&t.push(this.rect.bottomLeft),t}getBottomClipArea(){const t=[];return t.push(this.topIntersectPoint),"top"===this.corner?t.push({x:this.pageWidth,y:0}):(null!==this.topIntersectPoint&&t.push({x:this.pageWidth,y:0}),t.push({x:this.pageWidth,y:this.pageHeight})),null!==this.sideIntersectPoint?h.GetDistanceBetweenTwoPoint(this.sideIntersectPoint,this.topIntersectPoint)>=10&&t.push(this.sideIntersectPoint):"top"===this.corner&&t.push({x:this.pageWidth,y:this.pageHeight}),t.push(this.bottomIntersectPoint),t.push(this.topIntersectPoint),t}getAngle(){return 0===this.direction?-this.angle:this.angle}getRect(){return this.rect}getPosition(){return this.position}getActiveCorner(){return 0===this.direction?this.rect.topLeft:this.rect.topRight}getDirection(){return this.direction}getFlippingProgress(){return Math.abs((this.position.x-this.pageWidth)/(2*this.pageWidth)*100)}getCorner(){return this.corner}getBottomPagePosition(){return 1===this.direction?{x:this.pageWidth,y:0}:{x:0,y:0}}getShadowStartPoint(){return"top"===this.corner?this.topIntersectPoint:null!==this.sideIntersectPoint?this.sideIntersectPoint:this.topIntersectPoint}getShadowAngle(){const t=h.GetAngleBetweenTwoLine(this.getSegmentToShadowLine(),[{x:0,y:0},{x:this.pageWidth,y:0}]);return 0===this.direction?t:Math.PI-t}calcAngleAndPosition(t){let e=t;if(this.updateAngleAndGeometry(e),e="top"===this.corner?this.checkPositionAtCenterLine(e,{x:0,y:0},{x:0,y:this.pageHeight}):this.checkPositionAtCenterLine(e,{x:0,y:this.pageHeight},{x:0,y:0}),Math.abs(e.x-this.pageWidth)<1&&Math.abs(e.y)<1)throw new Error("Point is too small");return e}updateAngleAndGeometry(t){this.angle=this.calculateAngle(t),this.rect=this.getPageRect(t)}calculateAngle(t){const e=this.pageWidth-t.x+1,i="bottom"===this.corner?this.pageHeight-t.y:t.y;let s=2*Math.acos(e/Math.sqrt(i*i+e*e));i<0&&(s=-s);const n=Math.PI-s;if(!isFinite(s)||n>=0&&n<.003)throw new Error("The G point is too small");return"bottom"===this.corner&&(s=-s),s}getPageRect(t){return"top"===this.corner?this.getRectFromBasePoint([{x:0,y:0},{x:this.pageWidth,y:0},{x:0,y:this.pageHeight},{x:this.pageWidth,y:this.pageHeight}],t):this.getRectFromBasePoint([{x:0,y:-this.pageHeight},{x:this.pageWidth,y:-this.pageHeight},{x:0,y:0},{x:this.pageWidth,y:0}],t)}getRectFromBasePoint(t,e){return{topLeft:this.getRotatedPoint(t[0],e),topRight:this.getRotatedPoint(t[1],e),bottomLeft:this.getRotatedPoint(t[2],e),bottomRight:this.getRotatedPoint(t[3],e)}}getRotatedPoint(t,e){return{x:t.x*Math.cos(this.angle)+t.y*Math.sin(this.angle)+e.x,y:t.y*Math.cos(this.angle)-t.x*Math.sin(this.angle)+e.y}}calculateIntersectPoint(t){const e={left:-1,top:-1,width:this.pageWidth+2,height:this.pageHeight+2};"top"===this.corner?(this.topIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[t,this.rect.topRight],[{x:0,y:0},{x:this.pageWidth,y:0}]),this.sideIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[t,this.rect.bottomLeft],[{x:this.pageWidth,y:0},{x:this.pageWidth,y:this.pageHeight}]),this.bottomIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[this.rect.bottomLeft,this.rect.bottomRight],[{x:0,y:this.pageHeight},{x:this.pageWidth,y:this.pageHeight}])):(this.topIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[this.rect.topLeft,this.rect.topRight],[{x:0,y:0},{x:this.pageWidth,y:0}]),this.sideIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[t,this.rect.topLeft],[{x:this.pageWidth,y:0},{x:this.pageWidth,y:this.pageHeight}]),this.bottomIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[this.rect.bottomLeft,this.rect.bottomRight],[{x:0,y:this.pageHeight},{x:this.pageWidth,y:this.pageHeight}]))}checkPositionAtCenterLine(t,e,i){let s=t;const n=h.LimitPointToCircle(e,this.pageWidth,s);s!==n&&(s=n,this.updateAngleAndGeometry(s));const r=Math.sqrt(Math.pow(this.pageWidth,2)+Math.pow(this.pageHeight,2));let o=this.rect.bottomRight,a=this.rect.topLeft;if("bottom"===this.corner&&(o=this.rect.topRight,a=this.rect.bottomLeft),o.x<=0){const t=h.LimitPointToCircle(i,r,a);t!==s&&(s=t,this.updateAngleAndGeometry(s))}return s}getSegmentToShadowLine(){const t=this.getShadowStartPoint();return[t,t!==this.sideIntersectPoint&&null!==this.sideIntersectPoint?this.sideIntersectPoint:this.bottomIntersectPoint]}}class g{constructor(t,e){this.flippingPage=null,this.bottomPage=null,this.calc=null,this.state="read",this.render=t,this.app=e}fold(t){this.setState("user_fold"),null===this.calc&&this.start(t),this.do(this.render.convertToPage(t))}flip(t){if(this.app.getSettings().disableFlipByClick&&!this.isPointOnCorners(t))return;if(null!==this.calc&&this.render.finishAnimation(),!this.start(t))return;const e=this.getBoundsRect();this.setState("flipping");const i=e.height/10,s="bottom"===this.calc.getCorner()?e.height-i:i,n="bottom"===this.calc.getCorner()?e.height:0;this.calc.calc({x:e.pageWidth-i,y:s}),this.animateFlippingTo({x:e.pageWidth-i,y:s},{x:-e.pageWidth,y:n},!0)}start(t){this.reset();const e=this.render.convertToBook(t),i=this.getBoundsRect(),s=this.getDirectionByPoint(e),n=e.y>=i.height/2?"bottom":"top";if(!this.checkDirection(s))return!1;try{if(this.flippingPage=this.app.getPageCollection().getFlippingPage(s),this.bottomPage=this.app.getPageCollection().getBottomPage(s),"landscape"===this.render.getOrientation())if(1===s){const t=this.app.getPageCollection().nextBy(this.flippingPage);null!==t&&this.flippingPage.getDensity()!==t.getDensity()&&(this.flippingPage.setDrawingDensity("hard"),t.setDrawingDensity("hard"))}else{const t=this.app.getPageCollection().prevBy(this.flippingPage);null!==t&&this.flippingPage.getDensity()!==t.getDensity()&&(this.flippingPage.setDrawingDensity("hard"),t.setDrawingDensity("hard"))}return this.render.setDirection(s),this.calc=new a(s,n,i.pageWidth.toString(10),i.height.toString(10)),!0}catch(t){return!1}}do(t){if(null!==this.calc&&this.calc.calc(t)){const t=this.calc.getFlippingProgress();this.bottomPage.setArea(this.calc.getBottomClipArea()),this.bottomPage.setPosition(this.calc.getBottomPagePosition()),this.bottomPage.setAngle(0),this.bottomPage.setHardAngle(0),this.flippingPage.setArea(this.calc.getFlippingClipArea()),this.flippingPage.setPosition(this.calc.getActiveCorner()),this.flippingPage.setAngle(this.calc.getAngle()),0===this.calc.getDirection()?this.flippingPage.setHardAngle(90*(200-2*t)/100):this.flippingPage.setHardAngle(-90*(200-2*t)/100),this.render.setPageRect(this.calc.getRect()),this.render.setBottomPage(this.bottomPage),this.render.setFlippingPage(this.flippingPage),this.render.setShadowData(this.calc.getShadowStartPoint(),this.calc.getShadowAngle(),t,this.calc.getDirection())}}flipToPage(t,e){const i=this.app.getPageCollection().getCurrentSpreadIndex(),s=this.app.getPageCollection().getSpreadIndexByPage(t);try{s>i&&(this.app.getPageCollection().setCurrentSpreadIndex(s-1),this.flipNext(e)),s<i&&(this.app.getPageCollection().setCurrentSpreadIndex(s+1),this.flipPrev(e))}catch(t){}}flipNext(t){this.flip({x:this.render.getRect().left+2*this.render.getRect().pageWidth-10,y:"top"===t?1:this.render.getRect().height-2})}flipPrev(t){this.flip({x:10,y:"top"===t?1:this.render.getRect().height-2})}stopMove(){if(null===this.calc)return;const t=this.calc.getPosition(),e=this.getBoundsRect(),i="bottom"===this.calc.getCorner()?e.height:0;t.x<=0?this.animateFlippingTo(t,{x:-e.pageWidth,y:i},!0):this.animateFlippingTo(t,{x:e.pageWidth,y:i},!1)}showCorner(t){if(!this.checkState("read","fold_corner"))return;const e=this.getBoundsRect(),i=e.pageWidth;if(this.isPointOnCorners(t))if(null===this.calc){if(!this.start(t))return;this.setState("fold_corner"),this.calc.calc({x:i-1,y:1});const s=50,n="bottom"===this.calc.getCorner()?e.height-1:1,h="bottom"===this.calc.getCorner()?e.height-s:s;this.animateFlippingTo({x:i-1,y:n},{x:i-s,y:h},!1,!1)}else this.do(this.render.convertToPage(t));else this.setState("read"),this.render.finishAnimation(),this.stopMove()}animateFlippingTo(t,e,i,s=!0){const n=h.GetCordsFromTwoPoint(t,e),r=[];for(const t of n)r.push(()=>this.do(t));const o=this.getAnimationDuration(n.length);this.render.startAnimation(r,o,()=>{this.calc&&(i&&(1===this.calc.getDirection()?this.app.turnToPrevPage():this.app.turnToNextPage()),s&&(this.render.setBottomPage(null),this.render.setFlippingPage(null),this.render.clearShadow(),this.setState("read"),this.reset()))})}getCalculation(){return this.calc}getState(){return this.state}setState(t){this.state!==t&&(this.app.updateState(t),this.state=t)}getDirectionByPoint(t){const e=this.getBoundsRect();if("portrait"===this.render.getOrientation()){if(t.x-e.pageWidth<=e.width/5)return 1}else if(t.x<e.width/2)return 1;return 0}getAnimationDuration(t){const e=this.app.getSettings().flippingTime;return t>=1e3?e:t/1e3*e}checkDirection(t){return 0===t?this.app.getCurrentPageIndex()<this.app.getPageCount()-1:this.app.getCurrentPageIndex()>=1}reset(){this.calc=null,this.flippingPage=null,this.bottomPage=null}getBoundsRect(){return this.render.getRect()}checkState(...t){for(const e of t)if(this.state===e)return!0;return!1}isPointOnCorners(t){const e=this.getBoundsRect(),i=e.pageWidth,s=Math.sqrt(Math.pow(i,2)+Math.pow(e.height,2))/5,n=this.render.convertToBook(t);return n.x>0&&n.y>0&&n.x<e.width&&n.y<e.height&&(n.x<s||n.x>e.width-s)&&(n.y<s||n.y>e.height-s)}}class l{constructor(t,e){this.leftPage=null,this.rightPage=null,this.flippingPage=null,this.bottomPage=null,this.direction=null,this.orientation=null,this.shadow=null,this.animation=null,this.pageRect=null,this.boundsRect=null,this.timer=0,this.safari=!1,this.setting=e,this.app=t;const i=new RegExp("Version\\\\/[\\\\d\\\\.]+.*Safari/");this.safari=null!==i.exec(window.navigator.userAgent)}render(t){if(null!==this.animation){const e=Math.round((t-this.animation.startedAt)/this.animation.durationFrame);e<this.animation.frames.length?this.animation.frames[e]():(this.animation.onAnimateEnd(),this.animation=null)}this.timer=t,this.drawFrame()}start(){this.update();const t=e=>{this.render(e),requestAnimationFrame(t)};requestAnimationFrame(t)}startAnimation(t,e,i){this.finishAnimation(),this.animation={frames:t,duration:e,durationFrame:e/t.length,onAnimateEnd:i,startedAt:this.timer}}finishAnimation(){null!==this.animation&&(this.animation.frames[this.animation.frames.length-1](),null!==this.animation.onAnimateEnd&&this.animation.onAnimateEnd()),this.animation=null}update(){this.boundsRect=null;const t=this.calculateBoundsRect();this.orientation!==t&&(this.orientation=t,this.app.updateOrientation(t))}calculateBoundsRect(){let t="landscape";const e=this.getBlockWidth(),i=e/2,s=this.getBlockHeight()/2,n=this.setting.width/this.setting.height;let h=this.setting.width,r=this.setting.height,o=i-h;return"stretch"===this.setting.size?(e<2*this.setting.minWidth&&this.app.getSettings().usePortrait&&(t="portrait"),h="portrait"===t?this.getBlockWidth():this.getBlockWidth()/2,h>this.setting.maxWidth&&(h=this.setting.maxWidth),r=h/n,r>this.getBlockHeight()&&(r=this.getBlockHeight(),h=r*n),o="portrait"===t?i-h/2-h:i-h):e<2*h&&this.app.getSettings().usePortrait&&(t="portrait",o=i-h/2-h),this.boundsRect={left:o,top:s-r/2,width:2*h,height:r,pageWidth:h},t}setShadowData(t,e,i,s){if(!this.app.getSettings().drawShadow)return;const n=100*this.getSettings().maxShadowOpacity;this.shadow={pos:t,angle:e,width:3*this.getRect().pageWidth/4*i/100,opacity:(100-i)*n/100/100,direction:s,progress:2*i}}clearShadow(){this.shadow=null}getBlockWidth(){return this.app.getUI().getDistElement().offsetWidth}getBlockHeight(){return this.app.getUI().getDistElement().offsetHeight}getDirection(){return this.direction}getRect(){return null===this.boundsRect&&this.calculateBoundsRect(),this.boundsRect}getSettings(){return this.app.getSettings()}getOrientation(){return this.orientation}setPageRect(t){this.pageRect=t}setDirection(t){this.direction=t}setRightPage(t){null!==t&&t.setOrientation(1),this.rightPage=t}setLeftPage(t){null!==t&&t.setOrientation(0),this.leftPage=t}setBottomPage(t){null!==t&&t.setOrientation(1===this.direction?0:1),this.bottomPage=t}setFlippingPage(t){null!==t&&t.setOrientation(0===this.direction&&"portrait"!==this.orientation?0:1),this.flippingPage=t}convertToBook(t){const e=this.getRect();return{x:t.x-e.left,y:t.y-e.top}}isSafari(){return this.safari}convertToPage(t,e){e||(e=this.direction);const i=this.getRect();return{x:0===e?t.x-i.left-i.width/2:i.width/2-t.x+i.left,y:t.y-i.top}}convertToGlobal(t,e){if(e||(e=this.direction),null==t)return null;const i=this.getRect();return{x:0===e?t.x+i.left+i.width/2:i.width/2-t.x+i.left,y:t.y+i.top}}convertRectToGlobal(t,e){return e||(e=this.direction),{topLeft:this.convertToGlobal(t.topLeft,e),topRight:this.convertToGlobal(t.topRight,e),bottomLeft:this.convertToGlobal(t.bottomLeft,e),bottomRight:this.convertToGlobal(t.bottomRight,e)}}}class d extends l{constructor(t,e,i){super(t,e),this.canvas=i,this.ctx=i.getContext("2d")}getContext(){return this.ctx}reload(){}drawFrame(){this.clear(),"portrait"!==this.orientation&&null!=this.leftPage&&this.leftPage.simpleDraw(0),null!=this.rightPage&&this.rightPage.simpleDraw(1),null!=this.bottomPage&&this.bottomPage.draw(),this.drawBookShadow(),null!=this.flippingPage&&this.flippingPage.draw(),null!=this.shadow&&(this.drawOuterShadow(),this.drawInnerShadow());const t=this.getRect();"portrait"===this.orientation&&(this.ctx.beginPath(),this.ctx.rect(t.left+t.pageWidth,t.top,t.width,t.height),this.ctx.clip())}drawBookShadow(){const t=this.getRect();this.ctx.save(),this.ctx.beginPath();const e=t.width/20;this.ctx.rect(t.left,t.top,t.width,t.height);const i={x:t.left+t.width/2-e/2,y:0};this.ctx.translate(i.x,i.y);const s=this.ctx.createLinearGradient(0,0,e,0);s.addColorStop(0,"rgba(0, 0, 0, 0)"),s.addColorStop(.4,"rgba(0, 0, 0, 0.2)"),s.addColorStop(.49,"rgba(0, 0, 0, 0.1)"),s.addColorStop(.5,"rgba(0, 0, 0, 0.5)"),s.addColorStop(.51,"rgba(0, 0, 0, 0.4)"),s.addColorStop(1,"rgba(0, 0, 0, 0)"),this.ctx.clip(),this.ctx.fillStyle=s,this.ctx.fillRect(0,0,e,2*t.height),this.ctx.restore()}drawOuterShadow(){const t=this.getRect();this.ctx.save(),this.ctx.beginPath(),this.ctx.rect(t.left,t.top,t.width,t.height);const e=this.convertToGlobal({x:this.shadow.pos.x,y:this.shadow.pos.y});this.ctx.translate(e.x,e.y),this.ctx.rotate(Math.PI+this.shadow.angle+Math.PI/2);const i=this.ctx.createLinearGradient(0,0,this.shadow.width,0);0===this.shadow.direction?(this.ctx.translate(0,-100),i.addColorStop(0,"rgba(0, 0, 0, "+this.shadow.opacity+")"),i.addColorStop(1,"rgba(0, 0, 0, 0)")):(this.ctx.translate(-this.shadow.width,-100),i.addColorStop(0,"rgba(0, 0, 0, 0)"),i.addColorStop(1,"rgba(0, 0, 0, "+this.shadow.opacity+")")),this.ctx.clip(),this.ctx.fillStyle=i,this.ctx.fillRect(0,0,this.shadow.width,2*t.height),this.ctx.restore()}drawInnerShadow(){const t=this.getRect();this.ctx.save(),this.ctx.beginPath();const e=this.convertToGlobal({x:this.shadow.pos.x,y:this.shadow.pos.y}),i=this.convertRectToGlobal(this.pageRect);this.ctx.moveTo(i.topLeft.x,i.topLeft.y),this.ctx.lineTo(i.topRight.x,i.topRight.y),this.ctx.lineTo(i.bottomRight.x,i.bottomRight.y),this.ctx.lineTo(i.bottomLeft.x,i.bottomLeft.y),this.ctx.translate(e.x,e.y),this.ctx.rotate(Math.PI+this.shadow.angle+Math.PI/2);const s=3*this.shadow.width/4,n=this.ctx.createLinearGradient(0,0,s,0);0===this.shadow.direction?(this.ctx.translate(-s,-100),n.addColorStop(1,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(.9,"rgba(0, 0, 0, 0.05)"),n.addColorStop(.7,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(0,"rgba(0, 0, 0, 0)")):(this.ctx.translate(0,-100),n.addColorStop(0,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(.1,"rgba(0, 0, 0, 0.05)"),n.addColorStop(.3,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(1,"rgba(0, 0, 0, 0)")),this.ctx.clip(),this.ctx.fillStyle=n,this.ctx.fillRect(0,0,s,2*t.height),this.ctx.restore()}clear(){this.ctx.fillStyle="white",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)}}class p{constructor(t,e,i){this.touchPoint=null,this.swipeTimeout=250,this.onResize=()=>{this.update()},this.onMouseDown=t=>{if(this.checkTarget(t.target)){const e=this.getMousePos(t.clientX,t.clientY);this.app.startUserTouch(e),t.preventDefault()}},this.onTouchStart=t=>{if(this.checkTarget(t.target)&&t.changedTouches.length>0){const e=t.changedTouches[0],i=this.getMousePos(e.clientX,e.clientY);this.touchPoint={point:i,time:Date.now()},setTimeout(()=>{null!==this.touchPoint&&this.app.startUserTouch(i)},this.swipeTimeout),this.app.getSettings().mobileScrollSupport||t.preventDefault()}},this.onMouseUp=t=>{const e=this.getMousePos(t.clientX,t.clientY);this.app.userStop(e)},this.onMouseMove=t=>{const e=this.getMousePos(t.clientX,t.clientY);this.app.userMove(e,!1)},this.onTouchMove=t=>{if(t.changedTouches.length>0){const e=t.changedTouches[0],i=this.getMousePos(e.clientX,e.clientY);this.app.getSettings().mobileScrollSupport?(null!==this.touchPoint&&(Math.abs(this.touchPoint.point.x-i.x)>10||"read"!==this.app.getState())&&t.cancelable&&this.app.userMove(i,!0),"read"!==this.app.getState()&&t.preventDefault()):this.app.userMove(i,!0)}},this.onTouchEnd=t=>{if(t.changedTouches.length>0){const e=t.changedTouches[0],i=this.getMousePos(e.clientX,e.clientY);let s=!1;if(null!==this.touchPoint){const t=i.x-this.touchPoint.point.x,e=Math.abs(i.y-this.touchPoint.point.y);Math.abs(t)>this.swipeDistance&&e<2*this.swipeDistance&&Date.now()-this.touchPoint.time<this.swipeTimeout&&(t>0?this.app.flipPrev(this.touchPoint.point.y<this.app.getRender().getRect().height/2?"top":"bottom"):this.app.flipNext(this.touchPoint.point.y<this.app.getRender().getRect().height/2?"top":"bottom"),s=!0),this.touchPoint=null}this.app.userStop(i,s)}},this.parentElement=t,t.classList.add("stf__parent"),t.insertAdjacentHTML("afterbegin",\'<div class="stf__wrapper"></div>\'),this.wrapper=t.querySelector(".stf__wrapper"),this.app=e;const s=this.app.getSettings().usePortrait?1:2;t.style.minWidth=i.minWidth*s+"px",t.style.minHeight=i.minHeight+"px","fixed"===i.size&&(t.style.minWidth=i.width*s+"px",t.style.minHeight=i.height+"px"),i.autoSize&&(t.style.width="100%",t.style.maxWidth=2*i.maxWidth+"px"),t.style.display="block",window.addEventListener("resize",this.onResize,!1),this.swipeDistance=i.swipeDistance}destroy(){this.app.getSettings().useMouseEvents&&this.removeHandlers(),this.distElement.remove(),this.wrapper.remove()}getDistElement(){return this.distElement}getWrapper(){return this.wrapper}setOrientationStyle(t){this.wrapper.classList.remove("--portrait","--landscape"),"portrait"===t?(this.app.getSettings().autoSize&&(this.wrapper.style.paddingBottom=this.app.getSettings().height/this.app.getSettings().width*100+"%"),this.wrapper.classList.add("--portrait")):(this.app.getSettings().autoSize&&(this.wrapper.style.paddingBottom=this.app.getSettings().height/(2*this.app.getSettings().width)*100+"%"),this.wrapper.classList.add("--landscape")),this.update()}removeHandlers(){window.removeEventListener("resize",this.onResize),this.distElement.removeEventListener("mousedown",this.onMouseDown),this.distElement.removeEventListener("touchstart",this.onTouchStart),window.removeEventListener("mousemove",this.onMouseMove),window.removeEventListener("touchmove",this.onTouchMove),window.removeEventListener("mouseup",this.onMouseUp),window.removeEventListener("touchend",this.onTouchEnd)}setHandlers(){window.addEventListener("resize",this.onResize,!1),this.app.getSettings().useMouseEvents&&(this.distElement.addEventListener("mousedown",this.onMouseDown),this.distElement.addEventListener("touchstart",this.onTouchStart),window.addEventListener("mousemove",this.onMouseMove),window.addEventListener("touchmove",this.onTouchMove,{passive:!this.app.getSettings().mobileScrollSupport}),window.addEventListener("mouseup",this.onMouseUp),window.addEventListener("touchend",this.onTouchEnd))}getMousePos(t,e){const i=this.distElement.getBoundingClientRect();return{x:t-i.left,y:e-i.top}}checkTarget(t){return!this.app.getSettings().clickEventForward||!["a","button"].includes(t.tagName.toLowerCase())}}class c extends p{constructor(t,e,i,s){super(t,e,i),this.wrapper.insertAdjacentHTML("afterbegin",\'<div class="stf__block"></div>\'),this.distElement=t.querySelector(".stf__block"),this.items=s;for(const t of s)this.distElement.appendChild(t);this.setHandlers()}clear(){for(const t of this.items)this.parentElement.appendChild(t)}updateItems(t){this.removeHandlers(),this.distElement.innerHTML="";for(const e of t)this.distElement.appendChild(e);this.items=t,this.setHandlers()}update(){this.app.getRender().update()}}class u extends p{constructor(t,e,i){super(t,e,i),this.wrapper.innerHTML=\'<canvas class="stf__canvas"></canvas>\',this.canvas=t.querySelectorAll("canvas")[0],this.distElement=this.canvas,this.resizeCanvas(),this.setHandlers()}resizeCanvas(){const t=getComputedStyle(this.canvas),e=parseInt(t.getPropertyValue("width"),10),i=parseInt(t.getPropertyValue("height"),10);this.canvas.width=e,this.canvas.height=i}getCanvas(){return this.canvas}update(){this.resizeCanvas(),this.app.getRender().update()}}class w extends l{constructor(t,e,i){super(t,e),this.outerShadow=null,this.innerShadow=null,this.hardShadow=null,this.hardInnerShadow=null,this.element=i,this.createShadows()}createShadows(){this.element.insertAdjacentHTML("beforeend",\'<div class="stf__outerShadow"></div>\\n             <div class="stf__innerShadow"></div>\\n             <div class="stf__hardShadow"></div>\\n             <div class="stf__hardInnerShadow"></div>\'),this.outerShadow=this.element.querySelector(".stf__outerShadow"),this.innerShadow=this.element.querySelector(".stf__innerShadow"),this.hardShadow=this.element.querySelector(".stf__hardShadow"),this.hardInnerShadow=this.element.querySelector(".stf__hardInnerShadow")}clearShadow(){super.clearShadow(),this.outerShadow.style.cssText="display: none",this.innerShadow.style.cssText="display: none",this.hardShadow.style.cssText="display: none",this.hardInnerShadow.style.cssText="display: none"}reload(){this.element.querySelector(".stf__outerShadow")||this.createShadows()}drawHardInnerShadow(){const t=this.getRect(),e=this.shadow.progress>100?200-this.shadow.progress:this.shadow.progress;let i=(100-e)*(2.5*t.pageWidth)/100+20;i>t.pageWidth&&(i=t.pageWidth);let s=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+5).toString(10)};\\n            width: ${i}px;\\n            height: ${t.height}px;\\n            background: linear-gradient(to right,\\n                rgba(0, 0, 0, ${this.shadow.opacity*e/100}) 5%,\\n                rgba(0, 0, 0, 0) 100%);\\n            left: ${t.left+t.width/2}px;\\n            transform-origin: 0 0;\\n        `;s+=0===this.getDirection()&&this.shadow.progress>100||1===this.getDirection()&&this.shadow.progress<=100?"transform: translate3d(0, 0, 0);":"transform: translate3d(0, 0, 0) rotateY(180deg);",this.hardInnerShadow.style.cssText=s}drawHardOuterShadow(){const t=this.getRect();let e=(100-(this.shadow.progress>100?200-this.shadow.progress:this.shadow.progress))*(2.5*t.pageWidth)/100+20;e>t.pageWidth&&(e=t.pageWidth);let i=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+4).toString(10)};\\n            width: ${e}px;\\n            height: ${t.height}px;\\n            background: linear-gradient(to left, rgba(0, 0, 0, ${this.shadow.opacity}) 5%, rgba(0, 0, 0, 0) 100%);\\n            left: ${t.left+t.width/2}px;\\n            transform-origin: 0 0;\\n        `;i+=0===this.getDirection()&&this.shadow.progress>100||1===this.getDirection()&&this.shadow.progress<=100?"transform: translate3d(0, 0, 0) rotateY(180deg);":"transform: translate3d(0, 0, 0);",this.hardShadow.style.cssText=i}drawInnerShadow(){const t=this.getRect(),e=3*this.shadow.width/4,i=0===this.getDirection()?e:0,s=0===this.getDirection()?"to left":"to right",n=this.convertToGlobal(this.shadow.pos),r=this.shadow.angle+3*Math.PI/2,o=[this.pageRect.topLeft,this.pageRect.topRight,this.pageRect.bottomRight,this.pageRect.bottomLeft];let a="polygon( ";for(const t of o){let e=1===this.getDirection()?{x:-t.x+this.shadow.pos.x,y:t.y-this.shadow.pos.y}:{x:t.x-this.shadow.pos.x,y:t.y-this.shadow.pos.y};e=h.GetRotatedPoint(e,{x:i,y:100},r),a+=e.x+"px "+e.y+"px, "}a=a.slice(0,-2),a+=")";const g=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+10).toString(10)};\\n            width: ${e}px;\\n            height: ${2*t.height}px;\\n            background: linear-gradient(${s},\\n                rgba(0, 0, 0, ${this.shadow.opacity}) 5%,\\n                rgba(0, 0, 0, 0.05) 15%,\\n                rgba(0, 0, 0, ${this.shadow.opacity}) 35%,\\n                rgba(0, 0, 0, 0) 100%);\\n            transform-origin: ${i}px 100px;\\n            transform: translate3d(${n.x-i}px, ${n.y-100}px, 0) rotate(${r}rad);\\n            clip-path: ${a};\\n            -webkit-clip-path: ${a};\\n        `;this.innerShadow.style.cssText=g}drawOuterShadow(){const t=this.getRect(),e=this.convertToGlobal({x:this.shadow.pos.x,y:this.shadow.pos.y}),i=this.shadow.angle+3*Math.PI/2,s=1===this.getDirection()?this.shadow.width:0,n=0===this.getDirection()?"to right":"to left",r=[{x:0,y:0},{x:t.pageWidth,y:0},{x:t.pageWidth,y:t.height},{x:0,y:t.height}];let o="polygon( ";for(const t of r)if(null!==t){let e=1===this.getDirection()?{x:-t.x+this.shadow.pos.x,y:t.y-this.shadow.pos.y}:{x:t.x-this.shadow.pos.x,y:t.y-this.shadow.pos.y};e=h.GetRotatedPoint(e,{x:s,y:100},i),o+=e.x+"px "+e.y+"px, "}o=o.slice(0,-2),o+=")";const a=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+10).toString(10)};\\n            width: ${this.shadow.width}px;\\n            height: ${2*t.height}px;\\n            background: linear-gradient(${n}, rgba(0, 0, 0, ${this.shadow.opacity}), rgba(0, 0, 0, 0));\\n            transform-origin: ${s}px 100px;\\n            transform: translate3d(${e.x-s}px, ${e.y-100}px, 0) rotate(${i}rad);\\n            clip-path: ${o};\\n            -webkit-clip-path: ${o};\\n        `;this.outerShadow.style.cssText=a}drawLeftPage(){"portrait"!==this.orientation&&null!==this.leftPage&&(1===this.direction&&null!==this.flippingPage&&"hard"===this.flippingPage.getDrawingDensity()?(this.leftPage.getElement().style.zIndex=(this.getSettings().startZIndex+5).toString(10),this.leftPage.setHardDrawingAngle(180+this.flippingPage.getHardAngle()),this.leftPage.draw(this.flippingPage.getDrawingDensity())):this.leftPage.simpleDraw(0))}drawRightPage(){null!==this.rightPage&&(0===this.direction&&null!==this.flippingPage&&"hard"===this.flippingPage.getDrawingDensity()?(this.rightPage.getElement().style.zIndex=(this.getSettings().startZIndex+5).toString(10),this.rightPage.setHardDrawingAngle(180+this.flippingPage.getHardAngle()),this.rightPage.draw(this.flippingPage.getDrawingDensity())):this.rightPage.simpleDraw(1))}drawBottomPage(){if(null===this.bottomPage)return;const t=null!=this.flippingPage?this.flippingPage.getDrawingDensity():null;"portrait"===this.orientation&&1===this.direction||(this.bottomPage.getElement().style.zIndex=(this.getSettings().startZIndex+3).toString(10),this.bottomPage.draw(t))}drawFrame(){this.clear(),this.drawLeftPage(),this.drawRightPage(),this.drawBottomPage(),null!=this.flippingPage&&(this.flippingPage.getElement().style.zIndex=(this.getSettings().startZIndex+5).toString(10),this.flippingPage.draw()),null!=this.shadow&&null!==this.flippingPage&&("soft"===this.flippingPage.getDrawingDensity()?(this.drawOuterShadow(),this.drawInnerShadow()):(this.drawHardOuterShadow(),this.drawHardInnerShadow()))}clear(){for(const t of this.app.getPageCollection().getPages())t!==this.leftPage&&t!==this.rightPage&&t!==this.flippingPage&&t!==this.bottomPage&&(t.getElement().style.cssText="display: none"),t.getTemporaryCopy()!==this.flippingPage&&t.hideTemporaryCopy()}update(){super.update(),null!==this.rightPage&&this.rightPage.setOrientation(1),null!==this.leftPage&&this.leftPage.setOrientation(0)}}class x{constructor(){this._default={startPage:0,size:"fixed",width:0,height:0,minWidth:0,maxWidth:0,minHeight:0,maxHeight:0,drawShadow:!0,flippingTime:1e3,usePortrait:!0,startZIndex:0,autoSize:!0,maxShadowOpacity:1,showCover:!1,mobileScrollSupport:!0,swipeDistance:30,clickEventForward:!0,useMouseEvents:!0,showPageCorners:!0,disableFlipByClick:!1}}getSettings(t){const e=this._default;if(Object.assign(e,t),"stretch"!==e.size&&"fixed"!==e.size)throw new Error(\'Invalid size type. Available only "fixed" and "stretch" value\');if(e.width<=0||e.height<=0)throw new Error("Invalid width or height");if(e.flippingTime<=0)throw new Error("Invalid flipping time");return"stretch"===e.size?(e.minWidth<=0&&(e.minWidth=100),e.maxWidth<e.minWidth&&(e.maxWidth=2e3),e.minHeight<=0&&(e.minHeight=100),e.maxHeight<e.minHeight&&(e.maxHeight=2e3)):(e.minWidth=e.width,e.maxWidth=e.width,e.minHeight=e.height,e.maxHeight=e.height),e}}!function(t,e){void 0===e&&(e={});var i=e.insertAt;if(t&&"undefined"!=typeof document){var s=document.head||document.getElementsByTagName("head")[0],n=document.createElement("style");n.type="text/css","top"===i&&s.firstChild?s.insertBefore(n,s.firstChild):s.appendChild(n),n.styleSheet?n.styleSheet.cssText=t:n.appendChild(document.createTextNode(t))}}(".stf__parent {\\n  position: relative;\\n  display: block;\\n  box-sizing: border-box;\\n  transform: translateZ(0);\\n\\n  -ms-touch-action: pan-y;\\n  touch-action: pan-y;\\n}\\n\\n.sft__wrapper {\\n  position: relative;\\n  width: 100%;\\n  box-sizing: border-box;\\n}\\n\\n.stf__parent canvas {\\n  position: absolute;\\n  width: 100%;\\n  height: 100%;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__block {\\n  position: absolute;\\n  width: 100%;\\n  height: 100%;\\n  box-sizing: border-box;\\n  perspective: 2000px;\\n}\\n\\n.stf__item {\\n  display: none;\\n  position: absolute;\\n  transform-style: preserve-3d;\\n}\\n\\n.stf__outerShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__innerShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__hardShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__hardInnerShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}");t.PageFlip=class extends class{constructor(){this.events=new Map}on(t,e){return this.events.has(t)?this.events.get(t).push(e):this.events.set(t,[e]),this}off(t){this.events.delete(t)}trigger(t,e,i=null){if(this.events.has(t))for(const s of this.events.get(t))s({data:i,object:e})}}{constructor(t,e){super(),this.isUserTouch=!1,this.isUserMove=!1,this.setting=null,this.pages=null,this.setting=(new x).getSettings(e),this.block=t}destroy(){this.ui.destroy(),this.block.remove()}update(){this.render.update(),this.pages.show()}loadFromImages(t){this.ui=new u(this.block,this,this.setting);const e=this.ui.getCanvas();this.render=new d(this,this.setting,e),this.flipController=new g(this.render,this),this.pages=new n(this,this.render,t),this.pages.load(),this.render.start(),this.pages.show(this.setting.startPage),setTimeout(()=>{this.ui.update(),this.trigger("init",this,{page:this.setting.startPage,mode:this.render.getOrientation()})},1)}loadFromHTML(t){this.ui=new c(this.block,this,this.setting,t),this.render=new w(this,this.setting,this.ui.getDistElement()),this.flipController=new g(this.render,this),this.pages=new o(this,this.render,this.ui.getDistElement(),t),this.pages.load(),this.render.start(),this.pages.show(this.setting.startPage),setTimeout(()=>{this.ui.update(),this.trigger("init",this,{page:this.setting.startPage,mode:this.render.getOrientation()})},1)}updateFromImages(t){const e=this.pages.getCurrentPageIndex();this.pages.destroy(),this.pages=new n(this,this.render,t),this.pages.load(),this.pages.show(e),this.trigger("update",this,{page:e,mode:this.render.getOrientation()})}updateFromHtml(t){const e=this.pages.getCurrentPageIndex();this.pages.destroy(),this.pages=new o(this,this.render,this.ui.getDistElement(),t),this.pages.load(),this.ui.updateItems(t),this.render.reload(),this.pages.show(e),this.trigger("update",this,{page:e,mode:this.render.getOrientation()})}clear(){this.pages.destroy(),this.ui.clear()}turnToPrevPage(){this.pages.showPrev()}turnToNextPage(){this.pages.showNext()}turnToPage(t){this.pages.show(t)}flipNext(t="top"){this.flipController.flipNext(t)}flipPrev(t="top"){this.flipController.flipPrev(t)}flip(t,e="top"){this.flipController.flipToPage(t,e)}updateState(t){this.trigger("changeState",this,t)}updatePageIndex(t){this.trigger("flip",this,t)}updateOrientation(t){this.ui.setOrientationStyle(t),this.update(),this.trigger("changeOrientation",this,t)}getPageCount(){return this.pages.getPageCount()}getCurrentPageIndex(){return this.pages.getCurrentPageIndex()}getPage(t){return this.pages.getPage(t)}getRender(){return this.render}getFlipController(){return this.flipController}getOrientation(){return this.render.getOrientation()}getBoundsRect(){return this.render.getRect()}getSettings(){return this.setting}getUI(){return this.ui}getState(){return this.flipController.getState()}getPageCollection(){return this.pages}startUserTouch(t){this.mousePosition=t,this.isUserTouch=!0,this.isUserMove=!1}userMove(t,e){this.isUserTouch||e||!this.setting.showPageCorners?this.isUserTouch&&h.GetDistanceBetweenTwoPoint(this.mousePosition,t)>5&&(this.isUserMove=!0,this.flipController.fold(t)):this.flipController.showCorner(t)}userStop(t,e=!1){this.isUserTouch&&(this.isUserTouch=!1,e||(this.isUserMove?this.flipController.stopMove():this.flipController.flip(t)))}},Object.defineProperty(t,"__esModule",{value:!0})}));\n';
var NativeModal = ReactNative__namespace.Modal;
var NativeScrollView = ReactNative__namespace.ScrollView;
var NativeDimensions = ReactNative__namespace.Dimensions;
var DEFAULT_READER_THEME = {
  background: "#f5f5f4",
  surface: "#fafaf9",
  page: "#fffbea",
  border: "#e4e4e7",
  text: "#111827",
  mutedText: "#6b7280",
  accent: "#f97316",
  accentSurface: "#fff7ed",
  buttonSurface: "#fff",
  shadow: "#111827",
  overlayText: "#27272a",
  accentBlue: "#1d4ed8",
  accentRed: "#7f1d1d",
  accentGreen: "#166534",
  accentIndigo: "#3730a3",
  preserveInlineColors: true
};
var MIN_ZOOM_LEVEL = 0.5;
var MAX_ZOOM_LEVEL = 3;
var DEFAULT_ZOOM_LEVEL = 1.6;
var PDF_ZOOM_STEP = 0.75;
var VERSE_BUTTON_ZOOM_STEP_PX = 6;
var VERSE_GESTURE_ZOOM_STEP_PX = 3;
function resolveReaderTheme(theme) {
  return {
    ...DEFAULT_READER_THEME,
    ...theme || {}
  };
}
var COMPLETE_VERSE_STYLE_MAP = {
  classic: { color: "#111827", fontWeight: "800" },
  aarti: { color: "#9a3412", fontWeight: "800" },
  sutra: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  soft: { color: "#92400e", fontStyle: "italic", fontWeight: "800" },
  shastra: { color: "#0f172a", fontWeight: "900" },
  midnight: { color: "#1d4ed8", fontWeight: "900" },
  maroon: { color: "#7f1d1d", fontWeight: "900" },
  forest: { color: "#166534", fontWeight: "800" },
  indigo: { color: "#3730a3", fontWeight: "800" },
  graphite: { color: "#3f3f46", fontWeight: "800" }
};
var formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};
var hasNativeStaticServer = () => {
  const nativeServer = ReactNative.NativeModules.FPStaticServer;
  return nativeServer && typeof nativeServer.start === "function" && typeof nativeServer.stop === "function";
};
var escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var stripHtmlText = (value) => String(value || "").replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\s*\/p\s*>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
var decodeHtmlText = (value) => String(value || "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
var getHtmlAttribute = (tag, name) => {
  const pattern = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = tag.match(pattern);
  return match?.[1] || match?.[2] || match?.[3] || "";
};
var parseNativeInlineStyle = (tagName, tag) => {
  const style = {};
  if (tagName === "b" || tagName === "strong") {
    style.fontWeight = "900";
  }
  if (tagName === "i" || tagName === "em") {
    style.fontStyle = "italic";
  }
  if (tagName === "u") {
    style.textDecorationLine = "underline";
  }
  if (tagName === "s" || tagName === "strike" || tagName === "del") {
    style.textDecorationLine = "line-through";
  }
  const fontColor = getHtmlAttribute(tag, "color");
  if (tagName === "font" && fontColor) {
    style.color = fontColor;
  }
  const inlineStyle = getHtmlAttribute(tag, "style");
  for (const declaration of inlineStyle.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValueParts.join(":").trim();
    if (!property || !value) continue;
    if (property === "color") {
      style.color = value;
    } else if (property === "font-weight") {
      const numericWeight = Number(value);
      style.fontWeight = Number.isFinite(numericWeight) ? String(Math.max(600, Math.min(900, numericWeight))) : value.includes("bold") ? "900" : style.fontWeight;
    } else if (property === "font-style" && value.includes("italic")) {
      style.fontStyle = "italic";
    } else if (property === "text-decoration") {
      if (value.includes("underline")) {
        style.textDecorationLine = "underline";
      } else if (value.includes("line-through")) {
        style.textDecorationLine = "line-through";
      }
    }
  }
  return style;
};
var renderNativeRichText = (html, keyPrefix) => {
  const nodes = [];
  const styleStack = [{}];
  let key = 0;
  const currentStyle = () => Object.assign({}, ...styleStack);
  const pushText = (value) => {
    const decoded = decodeHtmlText(value);
    if (!decoded) return;
    nodes.push(
      /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: currentStyle(), children: decoded }, `${keyPrefix}-${key++}`)
    );
  };
  const pushBreak = (count = 1) => {
    pushText("\n".repeat(count));
  };
  const tokens = String(html || "").match(/<[^>]+>|[^<]+/g) || [];
  for (const token of tokens) {
    if (!token.startsWith("<")) {
      pushText(token);
      continue;
    }
    const isClosingTag = /^<\s*\//.test(token);
    const tagName = (token.replace(/^<\s*\/?\s*/, "").replace(/\/?\s*>$/, "").trim().split(/\s+/)[0] || "").toLowerCase();
    if (!tagName) continue;
    if (tagName === "br") {
      pushBreak();
      continue;
    }
    if (isClosingTag) {
      if (["p", "div", "li"].includes(tagName)) {
        pushBreak(tagName === "li" ? 1 : 2);
      }
      if ([
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "strike",
        "del",
        "span",
        "font"
      ].includes(tagName) && styleStack.length > 1) {
        styleStack.pop();
      }
      continue;
    }
    if (tagName === "li") {
      pushText("\u2022 ");
      continue;
    }
    if (tagName === "p" || tagName === "div") {
      continue;
    }
    if ([
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "strike",
      "del",
      "span",
      "font"
    ].includes(tagName)) {
      styleStack.push(parseNativeInlineStyle(tagName, token));
    }
  }
  return nodes;
};
var escapeJsString = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
var escapeJsData = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
var buildPdfHtml = (pdfUrl, title, targetPage, viewMode, zoomLevel, neighborPageCount, maxBookHeight) => `
<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes"
    />
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: #f5f5f4;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 12px;
        box-sizing: border-box;
        overflow: hidden;
      }
      #pages {
        flex: 1;
        overflow: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .status {
        padding: 24px 16px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        display: none;
      }
      .page {
        width: max-content;
        margin: auto;
        flex: 0 0 auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }
      .page.active {
        border-color: transparent;
        box-shadow: none;
      }
      #pages.continuous .page {
        margin: 0 auto 12px;
      }
      canvas {
        display: block;
        width: 100%;
        height: auto;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  </head>
  <body>
    <div id="app">
      <div id="status" class="status"></div>
      <div id="pages"></div>
    </div>
    <script>
      (function() {
        const title = '${escapeJsString(escapeHtml(title))}';
        const pdfUrl = '${escapeJsString(pdfUrl)}';
        const maxBookHeight = ${Math.max(320, Math.floor(maxBookHeight))};
        const initialPage = Math.max(1, ${Math.max(1, Math.trunc(targetPage))});
        const initialViewMode = '${viewMode}';
        let currentZoom = ${Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, zoomLevel))};
        const neighborPageCount = ${Math.max(0, Math.trunc(neighborPageCount))};
        const statusNode = document.getElementById('status');
        const appNode = document.getElementById('app');
        const pagesNode = document.getElementById('pages');
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        let pdf = null;
        let currentPage = initialPage;
        let currentViewMode = initialViewMode;
        let renderToken = 0;
        const pageRenderCache = new Map();
        const pageRenderInFlight = new Map();

        if (!pdfjsLib) {
          statusNode.textContent = 'Failed to load PDF renderer.';
          return;
        }

        if (!pdfUrl) {
          statusNode.textContent = 'PDF URL is missing.';
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const postMessage = (payload) => {
          if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
            return;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };

        const postContentHeight = () => {
          const pageNodes = Array.from(document.querySelectorAll('[data-page-number]'));
          const height = pageNodes.length
            ? Math.ceil(
                pageNodes.reduce((maxHeight, node) => {
                  const rect = node.getBoundingClientRect();
                  const scrollTop = window.scrollY || window.pageYOffset || 0;
                  return Math.max(
                    maxHeight,
                    rect.bottom + scrollTop,
                    rect.top + scrollTop + (node.scrollHeight || 0)
                  );
                }, 0) +
                  16
              )
            : Math.max(
                document.body.scrollHeight || 0,
                document.documentElement.scrollHeight || 0,
                pagesNode.scrollHeight || 0
              );
          postMessage({ type: 'content-height', height, viewMode: currentViewMode });
        };

        const scheduleContentHeightUpdates = () => {
          window.requestAnimationFrame(() => {
            postContentHeight();
            window.setTimeout(postContentHeight, 80);
            window.setTimeout(postContentHeight, 240);
          });
        };

        const applyViewModeLayout = (mode) => {
          const isCompleteMode = mode === 'continuous';
          // Keep both axes on one scroll owner. Splitting horizontal overflow onto
          // #pages and vertical overflow onto the WebView drops Y movement after a
          // gesture begins on a zoomed, horizontally overflowing PDF page.
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
          document.documentElement.style.height = '100%';
          document.body.style.height = '100%';
          if (appNode) {
            appNode.style.height = '100%';
          }
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x pan-y';
          pagesNode.style.flex = '1';
          pagesNode.style.height = '100%';
          pagesNode.classList.toggle('continuous', isCompleteMode);
          pagesNode.style.display = isCompleteMode ? 'block' : 'flex';
          pagesNode.style.alignItems = isCompleteMode ? 'stretch' : 'center';
          pagesNode.style.justifyContent = 'flex-start';
          pagesNode.style.overflowX = 'auto';
          pagesNode.style.overflowY = 'auto';
        };

        let lastInteractionAt = 0;
        const notifyInteraction = () => {
          const now = Date.now();
          if (now - lastInteractionAt < 120) return;
          lastInteractionAt = now;
          postMessage({ type: 'interaction' });
        };

        let pageFlip = null;
        let pageFlipReady = false;
        let suppressPageFlipEvent = false;

        const destroyPageFlip = () => {
          if (!pageFlip) return;
          try {
            pageFlip.destroy();
          } catch {
            // Fall back to clearing DOM below if the embedded flip engine is already detached.
          }
          pageFlip = null;
          pageFlipReady = false;
          suppressPageFlipEvent = false;
        };

        const clearPages = () => {
          destroyPageFlip();
          while (pagesNode.firstChild) {
            pagesNode.removeChild(pagesNode.firstChild);
          }
        };

        const clampPage = (pageNumber) => {
          if (!pdf || !pdf.numPages) return 1;
          return Math.max(1, Math.min(Number(pageNumber) || 1, pdf.numPages));
        };

        const renderPageToNode = async (pageNumber) => {
          const safePage = clampPage(pageNumber);
          if (pageRenderCache.has(safePage)) {
            return pageRenderCache.get(safePage);
          }
          if (pageRenderInFlight.has(safePage)) {
            return pageRenderInFlight.get(safePage);
          }

          const renderTask = (async () => {
            const page = await pdf.getPage(safePage);
            const unscaledViewport = page.getViewport({ scale: 1 });
            const targetWidth = Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
            const widthScale = targetWidth / unscaledViewport.width;
            const heightScale =
              Math.max(280, maxBookHeight - 26) / unscaledViewport.height;
            const scale =
              currentViewMode === 'book'
                ? Math.min(widthScale, heightScale * currentZoom)
                : widthScale;
            const renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const cssViewport = page.getViewport({ scale });
            const wrapper = document.createElement('div');
            wrapper.className = 'page active';
            wrapper.id = 'pdf-page-' + safePage;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
              throw new Error('Canvas is not available.');
            }

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            wrapper.appendChild(canvas);

            await page.render({ canvasContext: context, viewport }).promise;
            pageRenderCache.set(safePage, wrapper);
            return wrapper;
          })();

          pageRenderInFlight.set(safePage, renderTask);

          try {
            return await renderTask;
          } finally {
            pageRenderInFlight.delete(safePage);
          }
        };

        const pruneBookCache = (anchorPage) => {
          const keepPages = new Set();
          for (let offset = -neighborPageCount; offset <= neighborPageCount; offset += 1) {
            keepPages.add(clampPage(anchorPage + offset));
          }
          for (const pageNumber of Array.from(pageRenderCache.keys())) {
            if (!keepPages.has(pageNumber)) {
              pageRenderCache.delete(pageNumber);
            }
          }
        };

        const preRenderNeighborPages = (anchorPage) => {
          if (!pdf || currentViewMode !== 'book') return;
          const centerPage = clampPage(anchorPage);
          const neighbors = [];
          for (let offset = -neighborPageCount; offset <= neighborPageCount; offset += 1) {
            if (offset === 0) continue;
            const candidate = clampPage(centerPage + offset);
            if (candidate === centerPage) continue;
            if (!neighbors.includes(candidate)) {
              neighbors.push(candidate);
            }
          }

          for (const pageNumber of neighbors) {
            if (pageRenderCache.has(pageNumber) || pageRenderInFlight.has(pageNumber)) continue;
            void renderPageToNode(pageNumber).catch(() => {
              // keep navigation resilient if a neighbor pre-render fails
            });
          }
        };

        const renderPage = async (requestedPage, options) => {
          if (!pdf) return;
          const targetPage = clampPage(requestedPage);
          const announceReady = !options || options.announceReady !== false;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const wrapper = await renderPageToNode(targetPage);
            if (myToken !== renderToken) return;

            clearPages();
            wrapper.className = 'page active';
            pagesNode.appendChild(wrapper);
            currentPage = targetPage;
            pruneBookCache(targetPage);
            preRenderNeighborPages(targetPage);

            postMessage({
              type: 'book-page-size',
              height: Math.min(maxBookHeight, Math.ceil(wrapper.getBoundingClientRect().height + 24)),
            });
            postMessage({ type: 'page-change', pageNumber: targetPage });
            if (announceReady) {
              postMessage({ type: 'ready' });
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

        const continuousRenderInFlight = new Map();

        const createContinuousPlaceholders = () => {
          clearPages();
          const width = Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
          const estimatedHeight = Math.round(width * 1.414);
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const wrapper = document.createElement('div');
            wrapper.className = 'page';
            wrapper.id = 'pdf-page-' + pageNumber;
            wrapper.setAttribute('data-page-number', String(pageNumber));
            wrapper.style.width = width + 'px';
            wrapper.style.minHeight = estimatedHeight + 'px';
            pagesNode.appendChild(wrapper);
          }
        };

        const renderContinuousPage = async (pageNumber, token) => {
          const safePage = clampPage(pageNumber);
          const existing = continuousRenderInFlight.get(safePage);
          if (existing) return existing;

          const task = (async () => {
            const wrapper = document.getElementById('pdf-page-' + safePage);
            if (!wrapper || wrapper.querySelector('canvas')) return;
            const page = await pdf.getPage(safePage);
            if (token !== renderToken || currentViewMode !== 'continuous') return;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const targetWidth =
              Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
            const scale = targetWidth / unscaledViewport.width;
            const renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const cssViewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas is not available.');

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            wrapper.style.width = cssViewport.width + 'px';
            wrapper.style.minHeight = cssViewport.height + 'px';
            wrapper.replaceChildren(canvas);
            await page.render({ canvasContext: context, viewport }).promise;
          })();

          continuousRenderInFlight.set(safePage, task);
          try {
            await task;
          } finally {
            continuousRenderInFlight.delete(safePage);
          }
        };

        const renderContinuousWindow = async (anchorPage, token) => {
          const centerPage = clampPage(anchorPage);
          const keepPages = new Set();
          for (let offset = -neighborPageCount; offset <= neighborPageCount; offset += 1) {
            keepPages.add(clampPage(centerPage + offset));
          }

          for (const node of Array.from(pagesNode.querySelectorAll('[data-page-number]'))) {
            const pageNumber = Number(node.getAttribute('data-page-number'));
            if (!keepPages.has(pageNumber) && node.querySelector('canvas')) {
              node.replaceChildren();
            }
          }

          await renderContinuousPage(centerPage, token);
          for (const pageNumber of keepPages) {
            if (pageNumber === centerPage) continue;
            void renderContinuousPage(pageNumber, token).catch(() => {
              // A failed neighbor does not block the current page.
            });
          }
        };

        const renderAllPages = async (requestedPage) => {
          if (!pdf) return;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const targetPage = clampPage(requestedPage || currentPage || initialPage);
            createContinuousPlaceholders();
            const targetWrapper = document.getElementById('pdf-page-' + targetPage);
            currentPage = targetPage;
            targetWrapper?.scrollIntoView({ block: 'start' });
            await renderContinuousWindow(targetPage, myToken);
            if (myToken !== renderToken) return;
            targetWrapper?.scrollIntoView({ block: 'start' });
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postMessage({ type: 'ready' });
            scheduleContentHeightUpdates();
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

        const updateCompleteModePage = () => {
          if (!pdf || currentViewMode !== 'continuous') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const targetY = window.innerHeight * 0.35;

          for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const distance = Math.abs(rect.top - targetY);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPage = Number(node.getAttribute('data-page-number')) || bestPage;
            }
          }

          if (bestPage !== currentPage) {
            currentPage = bestPage;
            postMessage({ type: 'page-change', pageNumber: bestPage, isAutoScroll: true });
            void renderContinuousWindow(bestPage, renderToken);
          }
        };

        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');
            if (!pdf) return;

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'continuous') return;
              if (payload.mode === currentViewMode) return;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              postMessage({ type: 'page-change', pageNumber: currentPage });
              if (currentViewMode === 'continuous') {
                void renderAllPages(currentPage);
              } else {
                void renderPage(currentPage);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
                void renderContinuousWindow(currentPage, renderToken);
              }
              return;
            }
            if (requested === currentPage) return;
            renderPage(requested);
          } catch {
            // ignore malformed bridge payloads
          }
        };

        window.__PDF_READER_BRIDGE__ = {
          goToPage: (pageNumber) => {
            if (!pdf) return;
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
                void renderContinuousWindow(currentPage, renderToken);
              }
              return;
            }
            if (requested === currentPage) return;
            renderPage(requested);
          },
          setViewMode: (mode, page) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            if (mode === currentViewMode) {
              // Same mode \u2014 just navigate to page
              if (currentViewMode === 'continuous') {
                const target = document.getElementById('pdf-page-' + clampPage(requestedPage));
                if (target) {
                  currentPage = clampPage(requestedPage);
                  target.scrollIntoView({ block: 'start' });
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                  void renderContinuousWindow(currentPage, renderToken);
                }
              } else if (requestedPage !== currentPage) {
                void renderPage(requestedPage);
              }
              return;
            }
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            if (currentViewMode === 'continuous') {
              void renderAllPages(requestedPage);
            } else {
              void renderPage(requestedPage);
            }
          },
          setZoom: (zoom, page) => {
            const requestedZoom = Number(zoom);
            if (!Number.isFinite(requestedZoom)) return;
            currentZoom = Math.max(${MIN_ZOOM_LEVEL}, Math.min(${MAX_ZOOM_LEVEL}, requestedZoom));
            pageRenderCache.clear();
            const requestedPage = clampPage(page || currentPage);
            if (currentViewMode === 'continuous') {
              void renderAllPages(requestedPage);
            } else {
              void renderPage(requestedPage);
            }
          }
        };

        window.addEventListener('message', handleBridgeEvent);
        document.addEventListener('message', handleBridgeEvent);
        let completeModeScrollRaf = 0;
        let completeModeScrollDebounce = 0;
        const handleCompleteModeScroll = () => {
          if (currentViewMode !== 'continuous') {
            notifyInteraction();
            return;
          }
          if (completeModeScrollRaf) {
            window.cancelAnimationFrame(completeModeScrollRaf);
          }
          if (completeModeScrollDebounce) {
            window.clearTimeout(completeModeScrollDebounce);
          }
          completeModeScrollRaf = window.requestAnimationFrame(() => {
            completeModeScrollRaf = 0;
            updateCompleteModePage();
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            updateCompleteModePage();
            notifyInteraction();
          }, 120);
        };

        pagesNode.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
        window.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
        document.addEventListener('touchstart', notifyInteraction, { passive: true });
        let bookDragStart = null;
        pagesNode.addEventListener('pointerdown', (event) => {
          if (currentViewMode !== 'book' || event.isPrimary === false) return;
          bookDragStart = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
          };
          notifyInteraction();
        }, { passive: true });
        pagesNode.addEventListener('pointerup', (event) => {
          const start = bookDragStart;
          bookDragStart = null;
          if (
            !start ||
            start.pointerId !== event.pointerId ||
            currentViewMode !== 'book' ||
            currentZoom > 1.05
          ) {
            return;
          }
          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;
          if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
            return;
          }
          if (deltaX < 0) {
            void renderPage(currentPage + 1);
          } else {
            void renderPage(currentPage - 1);
          }
        }, { passive: true });
        pagesNode.addEventListener('pointercancel', () => {
          bookDragStart = null;
        }, { passive: true });

        const renderDocument = async () => {
          try {
            applyViewModeLayout(currentViewMode);
            const loadingTask = pdfjsLib.getDocument({
              url: pdfUrl,
              disableAutoFetch: true,
              disableRange: false,
              disableStream: false,
              withCredentials: false,
            });
            pdf = await loadingTask.promise;
            statusNode.style.display = 'none';

            postMessage({
              type: 'document-meta',
              pageCount: pdf.numPages,
            });
            if (currentViewMode === 'continuous') {
              await renderAllPages(initialPage);
            } else {
              await renderPage(initialPage);
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({
              type: 'error',
              message,
              code: /failed to fetch/i.test(message) ? 'fetch-failed' : 'render-failed',
            });
          }
        };

        renderDocument();
      })();
    </script>
  </body>
</html>`;
var buildVerseHtml = (verses, title, targetPage, viewMode, layout, typography, mappedVerseIds = [], spreadMode, showSecondPage, readerTheme) => {
  const theme = resolveReaderTheme(readerTheme);
  const preserveInlineColors = theme.preserveInlineColors === true;
  const isFullScreen = layout?.fullScreen === true;
  const minFontSizePx = Math.max(
    1,
    Math.round(Number(typography?.minFontSizePx) || 18)
  );
  const maxFontSizePx = Math.max(
    minFontSizePx,
    Math.round(Number(typography?.maxFontSizePx) || 36)
  );
  const defaultFontSizePx = Math.max(
    minFontSizePx,
    Math.min(
      maxFontSizePx,
      Math.round(Number(typography?.defaultFontSizePx) || 22)
    )
  );
  const safeFontSizePx = Math.max(
    minFontSizePx,
    Math.min(typography?.fontSizePx || defaultFontSizePx, maxFontSizePx)
  );
  const pageFlipBrowserScript = PAGE_FLIP_BROWSER_SCRIPT.replace(
    /<\/script/gi,
    "<\\/script"
  );
  const safeLineHeightEm = 1.45;
  const configuredMaxVersesPerPage = Number(layout?.maxVersesPerPage);
  const layoutConfig = {
    maxVersesPerPage: Number.isFinite(configuredMaxVersesPerPage) && configuredMaxVersesPerPage > 0 ? Math.max(1, Math.trunc(configuredMaxVersesPerPage)) : Number.MAX_SAFE_INTEGER,
    pagePaddingPx: Math.max(8, Math.trunc(layout?.pagePaddingPx || 18)),
    maxViewportUsage: Math.max(
      0.45,
      Math.min(layout?.maxViewportUsage || (isFullScreen ? 0.95 : 0.8), 0.95)
    ),
    verseFontSizePx: safeFontSizePx,
    minFontSizePx,
    defaultFontSizePx,
    maxFontSizePx,
    verseLineHeightEm: safeLineHeightEm,
    verseLabelFontSizePx: Math.max(11, Math.round(safeFontSizePx * 0.8)),
    verseGroupFontSizePx: Math.max(10, Math.round(safeFontSizePx * 0.72)),
    bookSpreadMode: spreadMode || (layout?.bookSpreadMode === "double" ? "double" : "single"),
    enablePageTurnEffect: layout?.enablePageTurnEffect !== false,
    showSecondPage: showSecondPage ?? layout?.showSecondPage !== false,
    viewportWidthPx: Math.max(
      320,
      Math.floor(Number(layout?.viewportWidthPx) || 360)
    ),
    viewportHeightPx: Math.max(
      320,
      Math.floor(Number(layout?.viewportHeightPx) || 640)
    ),
    readerHeightPx: Math.max(
      320,
      Math.floor(
        Number(layout?.readerHeightPx) || Number(layout?.viewportHeightPx) || 640
      )
    )
  };
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes"
    />
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        color: ${theme.text};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: ${isFullScreen ? 0 : 6}px;
        box-sizing: border-box;
      }
      #pages {
        flex: 1;
        min-height: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
      }
      .page {
        margin: 0;
        border: 0;
        border-radius: 12px;
        background: ${theme.page};
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }
      .page.active {
        border-color: transparent;
        box-shadow: none;
      }
      .book-spread {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 14px;
        perspective: 1400px;
        transform-style: preserve-3d;
      }
      .book-spread.single {
        align-items: center;
      }
      .book-spread.single .page.book-sheet {
        width: 100%;
        height: 100%;
      }
      .book-spread.double .page.book-sheet {
        width: calc((100% - 14px) / 2);
        height: 100%;
      }
      .book-spread.double,
      #page-flip-book.double-spread {
        position: relative;
      }
      .book-spread.double::after,
      #page-flip-book.double-spread::after {
        content: '';
        position: absolute;
        top: 14px;
        bottom: 14px;
        left: 50%;
        width: 2px;
        transform: translateX(-1px);
        pointer-events: none;
        z-index: 20;
        background: linear-gradient(
          to bottom,
          rgba(120, 53, 15, 0),
          rgba(120, 53, 15, 0.2) 12%,
          rgba(120, 53, 15, 0.34) 50%,
          rgba(120, 53, 15, 0.2) 88%,
          rgba(120, 53, 15, 0)
        );
        box-shadow:
          -5px 0 12px rgba(120, 53, 15, 0.08),
          5px 0 12px rgba(255, 255, 255, 0.6);
      }
      #page-flip-book {
        width: 100%;
        height: 100%;
        min-height: 0;
        margin: 0 auto;
        position: relative;
        touch-action: pan-y;
      }
      #page-flip-book .stf__parent,
      #page-flip-book .stf__wrapper,
      #page-flip-book .stf__block {
        box-sizing: border-box;
      }
      #page-flip-book .stf__wrapper {
        margin: 0 auto;
      }
      .page-flip-source {
        display: none;
      }
      .page.book-sheet {
        margin: 0;
        height: 100%;
        border-radius: 8px;
        border: 1px solid rgba(120, 53, 15, 0.22);
        background: ${theme.page};
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.72),
          inset 10px 0 18px rgba(120, 53, 15, 0.045),
          inset -10px 0 18px rgba(120, 53, 15, 0.035),
          0 10px 24px rgba(68, 64, 60, 0.12);
        position: relative;
        flex-shrink: 0;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        backface-visibility: hidden;
        transform-origin: center center;
        will-change: transform, opacity;
      }
      .page.book-sheet.active {
        border-color: rgba(120, 53, 15, 0.24);
      }
      .page.book-sheet::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 27px,
          rgba(148, 163, 184, 0.06) 28px
        );
      }
      .page.book-sheet::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            rgba(120, 53, 15, 0.08),
            rgba(120, 53, 15, 0) 9%,
            rgba(255, 255, 255, 0) 91%,
            rgba(120, 53, 15, 0.06)
          ),
          linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.58),
            rgba(255, 255, 255, 0) 18%,
            rgba(120, 53, 15, 0.035) 100%
          );
      }
      .book-spread.turn-next .page.book-sheet {
        animation: bookPageEnterNext 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        transform-origin: right center;
      }
      .book-spread.turn-prev .page.book-sheet {
        animation: bookPageEnterPrev 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        transform-origin: left center;
      }
      .book-spread.double.turn-next .page.book-sheet:nth-child(2) {
        animation-delay: 35ms;
      }
      .book-spread.double.turn-prev .page.book-sheet:nth-child(1) {
        animation-delay: 35ms;
      }
      @keyframes bookPageEnterNext {
        from {
          opacity: 0.78;
          transform: translateX(26px) rotateY(-8deg) scale(0.992);
        }
        to {
          opacity: 1;
          transform: translateX(0) rotateY(0deg) scale(1);
        }
      }
      @keyframes bookPageEnterPrev {
        from {
          opacity: 0.78;
          transform: translateX(-26px) rotateY(8deg) scale(0.992);
        }
        to {
          opacity: 1;
          transform: translateX(0) rotateY(0deg) scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .book-spread.turn-next .page.book-sheet,
        .book-spread.turn-prev .page.book-sheet {
          animation: none;
        }
      }
      .verse-page-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0;
        width: 100%;
        min-height: 100%;
        max-height: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: hidden;
        overscroll-behavior: contain;
        position: relative;
        z-index: 2;
      }
      .verse-block {
        border: 0;
        border-radius: 0;
        padding: 10px 12px;
        background: ${theme.page};
        position: relative;
        box-sizing: border-box;
        width: 100%;
        max-width: 760px;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-height: 100%;
      }
      .book-spread .verse-page-content {
        width: fit-content;
        height: 100%;
        max-width: 88%;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }
      .page.book-sheet.overflowing-verse .verse-page-content {
        justify-content: flex-start;
      }
      .book-spread .verse-block {
        width: auto;
        max-width: 100%;
      }
      .book-spread .verse-content {
        width: auto;
        max-width: 100%;
      }
      .verse-block.active-verse {
        background: ${theme.accentSurface};
      }
      .verse-label {
        margin: 0 0 4px;
        font-size: var(--verse-label-font-size, 12px);
        font-weight: 800;
        color: ${theme.accent};
        text-align: center;
      }
      .verse-group {
        margin: 0 0 4px;
        font-size: var(--verse-group-font-size, 11px);
        font-weight: 800;
        color: ${theme.mutedText};
        text-transform: uppercase;
        letter-spacing: 0.03em;
        text-align: center;
      }
      .verse-content {
        margin: 0;
        font-size: var(--verse-font-size, 22px);
        line-height: var(--verse-line-height, 1.45);
        color: ${theme.text};
        font-weight: 800;
        max-width: 100%;
        width: 100%;
        max-height: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: pre-wrap;
        text-align: center;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      .verse-content * {
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      ${preserveInlineColors ? "" : `.verse-content *,
      .verse-label * {
        color: inherit !important;
      }`}
      .verse-content.style-aarti,
      .verse-label.style-aarti {
        color: ${theme.accent};
        font-weight: 800;
      }
      .verse-content.style-sutra,
      .verse-label.style-sutra {
        color: ${theme.mutedText};
        font-weight: 800;
        text-transform: uppercase;
      }
      .verse-content.style-soft,
      .verse-label.style-soft {
        color: ${theme.mutedText};
        font-style: italic;
        font-weight: 800;
      }
      .verse-content.style-shastra,
      .verse-label.style-shastra {
        color: ${theme.text};
        font-weight: 900;
      }
      .verse-content.style-midnight,
      .verse-label.style-midnight {
        color: ${theme.accentBlue};
        font-weight: 900;
      }
      .verse-content.style-maroon,
      .verse-label.style-maroon {
        color: ${theme.accentRed};
        font-weight: 900;
      }
      .verse-content.style-forest,
      .verse-label.style-forest {
        color: ${theme.accentGreen};
        font-weight: 800;
      }
      .verse-content.style-indigo,
      .verse-label.style-indigo {
        color: ${theme.accentIndigo};
        font-weight: 800;
      }
      .verse-content.style-graphite,
      .verse-label.style-graphite {
        color: ${theme.mutedText};
        font-weight: 800;
      }
    </style>
    <script>
${pageFlipBrowserScript}
    </script>
  </head>
  <body>
    <div id="app">
      <div id="status" class="status"></div>
      <div id="pages"></div>
    </div>
    <script>
      (function() {
        const title = '${escapeJsString(escapeHtml(title))}';
        const initialPage = Math.max(1, ${Math.max(1, Math.trunc(targetPage))});
        const initialViewMode = '${viewMode}';
        const verses = ${escapeJsData(verses)};
        const layout = ${escapeJsData(layoutConfig)};
        const mappedVerseIds = new Set(${escapeJsData(mappedVerseIds)}.map((id) => String(id)));
        const statusNode = document.getElementById('status');
        const appNode = document.getElementById('app');
        const pagesNode = document.getElementById('pages');
        let currentPage = initialPage;
        let currentViewMode = initialViewMode;
        let versePages = [];

        const postMessage = (payload) => {
          if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
            return;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };

        const postContentHeight = () => {
          const pageNodes = Array.from(document.querySelectorAll('[data-page-number]'));
          const height = pageNodes.length
            ? Math.ceil(
                pageNodes.reduce((maxHeight, node) => {
                  const rect = node.getBoundingClientRect();
                  const scrollTop = window.scrollY || window.pageYOffset || 0;
                  return Math.max(maxHeight, rect.bottom + scrollTop);
                }, 0) +
                  16
              )
            : Math.max(
                document.body.scrollHeight || 0,
                document.documentElement.scrollHeight || 0,
                pagesNode.scrollHeight || 0
              );
          postMessage({ type: 'content-height', height, viewMode: currentViewMode });
        };

        const applyViewModeLayout = (mode) => {
          const isCompleteMode = mode === 'continuous';
          const useWindowScroll = isCompleteMode && layout.fullScreen === true;

          document.documentElement.style.overflow = useWindowScroll ? 'auto' : 'hidden';
          document.body.style.overflow = useWindowScroll ? 'auto' : 'hidden';
          document.documentElement.style.height = useWindowScroll ? 'auto' : '100%';
          document.body.style.height = useWindowScroll ? 'auto' : '100%';
          if (appNode) {
            appNode.style.display = useWindowScroll ? 'block' : 'flex';
            appNode.style.height = useWindowScroll ? 'auto' : '100%';
            appNode.style.overflow = useWindowScroll ? 'visible' : 'hidden';
          }
          document.documentElement.style.scrollBehavior = isCompleteMode ? 'smooth' : 'auto';
          document.body.style.scrollBehavior = isCompleteMode ? 'smooth' : 'auto';
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x';
          pagesNode.style.display = isCompleteMode ? 'block' : 'flex';
          pagesNode.style.flex = useWindowScroll ? 'none' : '1';
          pagesNode.style.justifyContent = isCompleteMode ? '' : 'flex-start';
          pagesNode.style.alignItems = isCompleteMode ? '' : 'stretch';
          pagesNode.style.overflowX = isCompleteMode ? 'hidden' : 'hidden';
          pagesNode.style.overflowY = useWindowScroll ? 'visible' : isCompleteMode ? 'auto' : 'hidden';
          pagesNode.style.height = useWindowScroll ? 'auto' : '100%';
          pagesNode.style.webkitOverflowScrolling = isCompleteMode ? 'touch' : 'auto';
          pagesNode.style.overscrollBehavior = 'contain';
        };

        const applyTypography = () => {
          document.documentElement.style.setProperty('--verse-font-size', String(layout.verseFontSizePx || 15) + 'px');
          document.documentElement.style.setProperty('--verse-line-height', String(layout.verseLineHeightEm || 1.45));
          document.documentElement.style.setProperty('--verse-label-font-size', String(layout.verseLabelFontSizePx || 12) + 'px');
          document.documentElement.style.setProperty('--verse-group-font-size', String(layout.verseGroupFontSizePx || 11) + 'px');
        };

        const applyZoomValue = (zoom) => {
          const requestedZoom = Number(zoom);
          if (!Number.isFinite(requestedZoom)) return false;
          const nextFontSize = Math.max(
            layout.minFontSizePx,
            Math.min(
              layout.maxFontSizePx,
              Math.round(layout.defaultFontSizePx * requestedZoom)
            )
          );
          if (nextFontSize === layout.verseFontSizePx) return false;
          layout.verseFontSizePx = nextFontSize;
          layout.verseLabelFontSizePx = Math.max(
            11,
            Math.round(nextFontSize * 0.8)
          );
          layout.verseGroupFontSizePx = Math.max(
            10,
            Math.round(nextFontSize * 0.72)
          );
          applyTypography();
          return true;
        };

        const getTouchDistance = (touches) => {
          if (!touches || touches.length < 2) return 0;
          const first = touches[0];
          const second = touches[1];
          const dx = (second.clientX || 0) - (first.clientX || 0);
          const dy = (second.clientY || 0) - (first.clientY || 0);
          return Math.sqrt((dx * dx) + (dy * dy));
        };

        let pinchStartDistance = 0;
        let pinchCurrentDistance = 0;
        const pinchStepRatio = 1.08;

        const flushPinchZoom = () => {
          if (!pinchStartDistance || !pinchCurrentDistance) return;
          const ratio = pinchCurrentDistance / pinchStartDistance;
          const rawSteps = Math.round(Math.log(ratio) / Math.log(pinchStepRatio));
          const deltaSteps = Math.max(-6, Math.min(6, rawSteps));
          if (deltaSteps !== 0) {
            postMessage({ type: 'verse-zoom', deltaSteps });
          }
          pinchStartDistance = 0;
          pinchCurrentDistance = 0;
        };

        const handleTouchStart = (event) => {
          if (!event || !event.touches || event.touches.length !== 2) return;
          pinchStartDistance = getTouchDistance(event.touches);
          pinchCurrentDistance = pinchStartDistance;
        };

        const handleTouchMove = (event) => {
          if (!pinchStartDistance || !event || !event.touches || event.touches.length !== 2) return;
          pinchCurrentDistance = getTouchDistance(event.touches);
          if (typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
        };

        const handleTouchEnd = () => {
          flushPinchZoom();
        };

        let lastInteractionAt = 0;
        const notifyInteraction = () => {
          const now = Date.now();
          if (now - lastInteractionAt < 120) return;
          lastInteractionAt = now;
          postMessage({ type: 'interaction' });
        };

        const clearPages = () => {
          while (pagesNode.firstChild) {
            pagesNode.removeChild(pagesNode.firstChild);
          }
        };

        const clampPage = (pageNumber) => {
          if (!versePages.length) return 1;
          return Math.max(1, Math.min(Number(pageNumber) || 1, versePages.length));
        };

        const getSpreadStep = () =>
          layout.bookSpreadMode === 'double' && layout.showSecondPage !== false
            ? 2
            : 1;

        const getSpreadAnchor = (pageNumber) => {
          const safePage = clampPage(pageNumber);
          if (layout.bookSpreadMode !== 'double' || layout.showSecondPage === false) {
            return safePage;
          }
          return safePage % 2 === 0 ? safePage - 1 : safePage;
        };

        const getAllowedInlineStyle = (styleValue) => {
          if (!styleValue) return '';

          const probe = document.createElement('span');
          probe.setAttribute('style', String(styleValue));

          const parts = [];
          const color = probe.style.color;
          const fontWeight = probe.style.fontWeight;
          const fontStyle = probe.style.fontStyle;
          const textDecoration = probe.style.textDecorationLine || probe.style.textDecoration;

          if (${preserveInlineColors ? "true" : "false"} && color) {
            parts.push('color: ' + color);
          }

          if (fontWeight) {
            parts.push('font-weight: ' + fontWeight);
          }

          if (fontStyle) {
            parts.push('font-style: ' + fontStyle);
          }

          if (textDecoration) {
            parts.push('text-decoration: ' + textDecoration);
          }

          return parts.join('; ');
        };

        const appendSanitizedRichContent = (targetNode, rawContent) => {
          const root = document.createElement('div');
          root.innerHTML = String(rawContent || '');

          const allowedTags = new Set(['SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'BR']);

          const appendNode = (parentNode, sourceNode) => {
            if (!sourceNode) return;

            if (sourceNode.nodeType === Node.TEXT_NODE) {
              parentNode.appendChild(document.createTextNode(sourceNode.textContent || ''));
              return;
            }

            if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
              return;
            }

            const sourceEl = sourceNode;
            const tagName = String(sourceEl.tagName || '').toUpperCase();

            if (!allowedTags.has(tagName)) {
              for (const child of Array.from(sourceEl.childNodes || [])) {
                appendNode(parentNode, child);
              }
              return;
            }

            if (tagName === 'BR') {
              parentNode.appendChild(document.createElement('br'));
              return;
            }

            const outEl = document.createElement(tagName.toLowerCase());
            const safeStyle = getAllowedInlineStyle(sourceEl.getAttribute('style'));
            if (safeStyle) {
              outEl.setAttribute('style', safeStyle);
            }

            for (const child of Array.from(sourceEl.childNodes || [])) {
              appendNode(outEl, child);
            }

            parentNode.appendChild(outEl);
          };

          for (const child of Array.from(root.childNodes || [])) {
            appendNode(targetNode, child);
          }
        };

        const createVerseBlock = (verse) => {
          const block = document.createElement('article');
          block.className = 'verse-block';
          block.setAttribute('data-verse-id', String(verse.id));
          if (verse.groupId !== null && verse.groupId !== undefined) {
            block.setAttribute('data-group-id', String(verse.groupId));
          }
          const styleClass = verse.styleKey ? 'style-' + String(verse.styleKey).replace(/[^a-zA-Z0-9_-]/g, '') : '';

          if (verse.groupLabel) {
            const groupEl = document.createElement('p');
            groupEl.className = 'verse-group';
            groupEl.textContent = String(verse.groupLabel);
            block.appendChild(groupEl);
          }

          if (verse.label) {
            const labelEl = document.createElement('p');
            labelEl.className = styleClass ? ('verse-label ' + styleClass) : 'verse-label';
            labelEl.textContent = String(verse.label);
            block.appendChild(labelEl);
          }

          const contentEl = document.createElement('p');
          contentEl.className = styleClass ? ('verse-content ' + styleClass) : 'verse-content';
          appendSanitizedRichContent(contentEl, String(verse.content || '').trim());
          block.appendChild(contentEl);
          return block;
        };

        const paginateVerses = () => {
          if (!Array.isArray(verses) || !verses.length) {
            versePages = [];
            return;
          }

          const viewportWidth = Math.max(
            280,
            Math.floor(window.innerWidth || layout.viewportWidthPx || 360)
          );
          const viewportHeight = Math.max(
            320,
            Math.floor(window.innerHeight || layout.readerHeightPx || layout.viewportHeightPx || 640)
          );
          const availablePageWidth = Math.max(
            280,
            viewportWidth - (layout.fullScreen ? 4 : 12)
          );
          const targetWidth =
            layout.bookSpreadMode === 'double' &&
            layout.showSecondPage !== false
              ? Math.max(280, (availablePageWidth - 14) / 2)
              : availablePageWidth;
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 18;
          const maxVersesPerPage =
            currentViewMode === 'book'
              ? 1
              : Number.isFinite(Number(layout.maxVersesPerPage)) &&
                  Number(layout.maxVersesPerPage) > 0
                ? Math.max(1, Math.trunc(Number(layout.maxVersesPerPage)))
                : Number.MAX_SAFE_INTEGER;
          const referenceHeight = layout.fullScreen
            ? viewportHeight
            : Math.max(
                320,
                Math.floor(
                  Number(layout.readerHeightPx) ||
                    Number(layout.viewportHeightPx) ||
                    640
                )
              );
          const usableHeight = Math.max(
            220,
            referenceHeight - (layout.fullScreen ? 4 : 12)
          );
          const maxContentHeight = Math.max(120, usableHeight - pagePadding * 2);

          const measureHost = document.createElement('div');
          measureHost.style.position = 'fixed';
          measureHost.style.left = '-99999px';
          measureHost.style.top = '0';
          measureHost.style.width = targetWidth + 'px';
          measureHost.style.visibility = 'hidden';
          measureHost.style.pointerEvents = 'none';
          document.body.appendChild(measureHost);

          const pageWrap = document.createElement('div');
          pageWrap.className = 'page';
          pageWrap.style.width = targetWidth + 'px';
          pageWrap.style.padding = pagePadding + 'px';
          const contentWrap = document.createElement('div');
          contentWrap.className = 'verse-page-content';
          pageWrap.appendChild(contentWrap);
          measureHost.appendChild(pageWrap);

          const pages = [];
          let current = [];

          const flushCurrent = () => {
            if (!current.length) return;
            pages.push(current);
            current = [];
            while (contentWrap.firstChild) {
              contentWrap.removeChild(contentWrap.firstChild);
            }
          };

          for (let index = 0; index < verses.length; index += 1) {
            const verse = verses[index];
            if (!verse || !String(verse.content || '').trim()) {
              continue;
            }

            const block = createVerseBlock(verse);
            contentWrap.appendChild(block);
            current.push(verse);

            const overflowed =
              current.length > 1 && contentWrap.scrollHeight > maxContentHeight;
            const reachedCap = current.length > maxVersesPerPage;

            if (overflowed || reachedCap) {
              current.pop();
              contentWrap.removeChild(block);
              flushCurrent();

              contentWrap.appendChild(block);
              current.push(verse);

              if (contentWrap.scrollHeight > maxContentHeight) {
                flushCurrent();
              }
            }
          }

          flushCurrent();
          document.body.removeChild(measureHost);
          versePages = pages;
        };

        const getBookContentFits = () => {
          if (currentViewMode !== 'book') return true;
          const isVisibleBookSheet = (pageNode) => {
            const rect = pageNode.getBoundingClientRect();
            return rect.width > 1 && rect.height > 1;
          };
          const activePages = Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          ).filter(isVisibleBookSheet);
          if (!activePages.length) return true;
          return activePages.every((pageNode) => {
            const contentNode = pageNode.querySelector('.verse-page-content');
            if (!contentNode) return true;
            return (
              contentNode.scrollHeight <= contentNode.clientHeight + 2 &&
              contentNode.scrollWidth <= contentNode.clientWidth + 2
            );
          });
        };

        const updateBookOverflowClasses = () => {
          if (currentViewMode !== 'book') return;
          for (const pageNode of Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          )) {
            const rect = pageNode.getBoundingClientRect();
            if (rect.width <= 1 || rect.height <= 1) {
              pageNode.classList.remove('overflowing-verse');
              continue;
            }
            const contentNode = pageNode.querySelector('.verse-page-content');
            const overflowing =
              Boolean(contentNode) &&
              (contentNode.scrollHeight > contentNode.clientHeight + 2 ||
                contentNode.scrollWidth > contentNode.clientWidth + 2);
            pageNode.classList.toggle('overflowing-verse', overflowing);
          }
        };

        const postVerseLayoutState = () => {
          updateBookOverflowClasses();
          const contentFits = getBookContentFits();
          postMessage({
            type: 'verse-layout-state',
            contentFits,
            canZoomIn:
              currentViewMode !== 'book' ||
              (contentFits && layout.verseFontSizePx < layout.maxFontSizePx),
          });
        };

        const buildPageNode = (pageNumber, active) => {
          const pageData = versePages[pageNumber - 1] || [];
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 18;
          const wrapper = document.createElement('div');
          wrapper.className = active ? 'page active' : 'page';
          wrapper.id = 'pdf-page-' + pageNumber;
          wrapper.setAttribute('data-page-number', String(pageNumber));
          wrapper.style.padding = pagePadding + 'px';
          wrapper.style.boxSizing = 'border-box';
          wrapper.setAttribute('aria-label', title + ' page ' + pageNumber);

          const contentWrap = document.createElement('div');
          contentWrap.className = 'verse-page-content';
          for (const verse of pageData) {
            contentWrap.appendChild(createVerseBlock(verse));
          }
          wrapper.appendChild(contentWrap);
          return wrapper;
        };

        const updateBookActivePage = (pageNumber) => {
          const activePage = clampPage(pageNumber);
          for (const pageNode of Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          )) {
            pageNode.classList.toggle(
              'active',
              Number(pageNode.getAttribute('data-page-number')) === activePage
            );
          }
        };

        const getBookPageDimensions = () => {
          const bounds = pagesNode.getBoundingClientRect();
          const viewportWidth = Math.max(
            280,
            Math.floor(bounds.width || window.innerWidth || layout.viewportWidthPx || 360)
          );
          const viewportHeight = Math.max(
            320,
            Math.floor(bounds.height || window.innerHeight || layout.readerHeightPx || layout.viewportHeightPx || 640)
          );
          const isDouble =
            layout.bookSpreadMode === 'double' && layout.showSecondPage !== false;
          const spreadGap = isDouble ? 14 : 0;
          const pageWidth = Math.max(
            isDouble ? 220 : 280,
            Math.floor((viewportWidth - spreadGap) / (isDouble ? 2 : 1))
          );

          return {
            isDouble,
            pageWidth,
            pageHeight: viewportHeight,
            bookWidth: isDouble ? pageWidth * 2 : pageWidth,
            bookHeight: viewportHeight,
          };
        };

        const buildPageFlipPageNode = (pageNumber, active, dimensions) => {
          const pageNode = buildPageNode(pageNumber, active);
          pageNode.classList.add('book-sheet');
          pageNode.classList.add('page-flip-page');
          pageNode.setAttribute('data-density', 'soft');
          pageNode.style.width = dimensions.pageWidth + 'px';
          pageNode.style.height = dimensions.pageHeight + 'px';
          return pageNode;
        };

        const renderSimpleBookPage = (requestedPage, announceReady, directionHint) => {
          const targetPage = getSpreadAnchor(requestedPage);
          const direction =
            directionHint ||
            (targetPage > currentPage
              ? 'next'
              : targetPage < currentPage
                ? 'prev'
                : 'none');
          clearPages();

          const spreadNode = document.createElement('div');
          const spreadClass =
            layout.bookSpreadMode === 'double' && layout.showSecondPage !== false
              ? 'double'
              : 'single';
          spreadNode.className =
            'book-spread ' +
            spreadClass;
          if (layout.enablePageTurnEffect !== false) {
            if (direction === 'next') spreadNode.classList.add('turn-next');
            if (direction === 'prev') spreadNode.classList.add('turn-prev');
          }

          const primaryPage = buildPageNode(targetPage, true);
          primaryPage.classList.add('book-sheet');
          spreadNode.appendChild(primaryPage);

          if (layout.bookSpreadMode === 'double' && layout.showSecondPage !== false) {
            const secondPage = targetPage + 1;
            if (secondPage <= versePages.length) {
              const secondaryPage = buildPageNode(secondPage, false);
              secondaryPage.classList.add('book-sheet');
              spreadNode.appendChild(secondaryPage);
            }
          }

          pagesNode.appendChild(spreadNode);
          currentPage = targetPage;
          updateBookOverflowClasses();
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postVerseLayoutState();
          if (announceReady !== false) {
            postMessage({ type: 'ready' });
          }
          scheduleContentHeightUpdates();
        };

        const renderPageFlipBook = (requestedPage, announceReady) => {
          if (!window.St || !window.St.PageFlip) {
            return false;
          }

          const targetPage = getSpreadAnchor(requestedPage);
          const dimensions = getBookPageDimensions();
          clearPages();

          const bookNode = document.createElement('div');
          bookNode.id = 'page-flip-book';
          bookNode.className = dimensions.isDouble ? 'double-spread' : 'single-spread';
          bookNode.style.width = dimensions.bookWidth + 'px';
          bookNode.style.height = dimensions.bookHeight + 'px';
          bookNode.style.minWidth = dimensions.bookWidth + 'px';
          bookNode.style.minHeight = dimensions.bookHeight + 'px';
          bookNode.style.maxWidth = '100%';
          bookNode.style.maxHeight = '100%';

          const pageNodes = [];
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            const pageNode = buildPageFlipPageNode(
              pageNumber,
              pageNumber === targetPage,
              dimensions
            );
            pageNodes.push(pageNode);
            bookNode.appendChild(pageNode);
          }

          pagesNode.appendChild(bookNode);

          try {
            suppressPageFlipEvent = true;
            pageFlip = new window.St.PageFlip(bookNode, {
              width: dimensions.pageWidth,
              height: dimensions.pageHeight,
              size: 'fixed',
              minWidth: dimensions.pageWidth,
              maxWidth: dimensions.pageWidth,
              minHeight: dimensions.pageHeight,
              maxHeight: dimensions.pageHeight,
              startPage: Math.max(0, targetPage - 1),
              drawShadow: true,
              flippingTime: 420,
              usePortrait: !dimensions.isDouble,
              startZIndex: 0,
              autoSize: false,
              maxShadowOpacity: 0.24,
              showCover: false,
              mobileScrollSupport: true,
              swipeDistance: 30,
              clickEventForward: true,
              useMouseEvents: true,
              showPageCorners: false,
              disableFlipByClick: false,
            });

            if (typeof pageFlip.userStop === 'function') {
              const originalUserStop = pageFlip.userStop.bind(pageFlip);
              pageFlip.userStop = (point, isSwipe) => {
                if (isSwipe || pageFlip.isUserMove) {
                  originalUserStop(point, isSwipe);
                  return;
                }
                originalUserStop(point, true);
              };
            }

            pageFlip.on('flip', (event) => {
              if (suppressPageFlipEvent) return;
              const flippedPage = clampPage((Number(event?.data) || 0) + 1);
              currentPage = getSpreadAnchor(flippedPage);
              updateBookActivePage(currentPage);
              updateBookOverflowClasses();
              postMessage({ type: 'page-change', pageNumber: currentPage });
              postVerseLayoutState();
              scheduleContentHeightUpdates();
            });

            pageFlip.loadFromHTML(pageNodes);
            currentPage = targetPage;
            updateBookActivePage(currentPage);
            updateBookOverflowClasses();
            pageFlipReady = true;
            window.setTimeout(() => {
              suppressPageFlipEvent = false;
            }, 60);
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postVerseLayoutState();
            if (announceReady !== false) {
              postMessage({ type: 'ready' });
            }
            scheduleContentHeightUpdates();
            return true;
          } catch {
            destroyPageFlip();
            clearPages();
            return false;
          }
        };

        const renderBookPage = (requestedPage, announceReady, directionHint) => {
          if (
            layout.enablePageTurnEffect !== false &&
            renderPageFlipBook(requestedPage, announceReady)
          ) {
            return;
          }

          renderSimpleBookPage(requestedPage, announceReady, directionHint);
        };

        const postBookPageChange = (pageNumber) => {
          currentPage = getSpreadAnchor(pageNumber);
          updateBookActivePage(currentPage);
          updateBookOverflowClasses();
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postVerseLayoutState();
          scheduleContentHeightUpdates();
        };

        const forcePageFlipPage = (pageNumber) => {
          const targetPage = getSpreadAnchor(pageNumber);
          if (!pageFlip || !pageFlip.turnToPage) {
            renderBookPage(targetPage, false, 'none');
            return;
          }
          try {
            suppressPageFlipEvent = true;
            pageFlip.turnToPage(Math.max(0, targetPage - 1));
            postBookPageChange(targetPage);
          } catch {
            renderBookPage(targetPage, false, 'none');
          } finally {
            window.setTimeout(() => {
              suppressPageFlipEvent = false;
            }, 40);
          }
        };

        const turnPageFlipToPage = (targetPage) => {
          if (!window.St || !window.St.PageFlip) return false;

          const anchoredTarget = getSpreadAnchor(targetPage);
          const anchoredCurrent = getSpreadAnchor(currentPage);
          if (anchoredTarget === anchoredCurrent) return true;

          const step = getSpreadStep();
          const isAdjacent =
            Math.abs(anchoredTarget - anchoredCurrent) <= step;
          if (!isAdjacent) {
            forcePageFlipPage(anchoredTarget);
            return true;
          }

          const direction = anchoredTarget > anchoredCurrent ? 'next' : 'prev';
          const initialized = renderPageFlipBook(anchoredCurrent, false);
          if (!initialized) return false;

          window.setTimeout(() => {
            try {
              if (direction === 'next' && pageFlip && pageFlip.flipNext) {
                pageFlip.flipNext('bottom');
              } else if (direction === 'prev' && pageFlip && pageFlip.flipPrev) {
                pageFlip.flipPrev('bottom');
              } else {
                forcePageFlipPage(anchoredTarget);
                return;
              }

              window.setTimeout(() => {
                renderBookPage(anchoredTarget, false, 'none');
              }, 900);
            } catch {
              forcePageFlipPage(anchoredTarget);
            }
          }, 90);

          return true;
        };

        const turnRelativeBookPage = (direction) => {
          if (currentViewMode !== 'book') return;
          const step = getSpreadStep();
          const targetPage =
            direction === 'next'
              ? clampPage(currentPage + step)
              : clampPage(currentPage - step);
          if (targetPage === currentPage) return;

          if (layout.enablePageTurnEffect !== false && pageFlip && pageFlipReady) {
            try {
              if (pageFlip.getState && pageFlip.getState() !== 'read') return;
              if (direction === 'next' && pageFlip.flipNext) {
                pageFlip.flipNext('bottom');
              } else if (direction === 'prev' && pageFlip.flipPrev) {
                pageFlip.flipPrev('bottom');
              } else {
                renderBookPage(targetPage, false, 'none');
                return;
              }

              const startingPage = currentPage;
              window.setTimeout(() => {
                if (currentPage === startingPage) {
                  renderBookPage(targetPage, false, 'none');
                }
              }, 520);
              return;
            } catch {
              pageFlipReady = false;
            }
          }

          renderBookPage(targetPage, false, direction);
        };

        const findVerseNode = (verseId) => {
          const safeVerseId =
            verseId === null || verseId === undefined ? '' : String(verseId);
          if (!safeVerseId) return null;
          return (
            Array.from(document.querySelectorAll('[data-verse-id]')).find(
              (node) => node.getAttribute('data-verse-id') === safeVerseId
            ) || null
          );
        };

        const getVersePage = (verseId) => {
          const safeVerseId =
            verseId === null || verseId === undefined ? '' : String(verseId);
          if (!safeVerseId) return 0;
          return versePages.findIndex((pageItems) =>
            pageItems.some(
              (verse) => String(verse.id) === safeVerseId
            )
          ) + 1;
        };

        const renderAllPages = (requestedPage, anchorVerseId) => {
          const targetPage = clampPage(requestedPage || currentPage || 1);
          clearPages();
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            pagesNode.appendChild(buildPageNode(pageNumber, false));
          }
          currentPage = targetPage;
          const target =
            findVerseNode(anchorVerseId) ||
            document.getElementById('pdf-page-' + targetPage);
          if (target) {
            target.scrollIntoView({ block: 'start' });
            window.requestAnimationFrame(() => {
              target.scrollIntoView({ block: 'start' });
            });
          }
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postMessage({ type: 'ready' });
          if (currentViewMode === 'continuous') {
            scheduleContentHeightUpdates();
          }
        };

        const updateCompleteModePage = () => {
          if (currentViewMode !== 'continuous') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const viewportHeight = Math.max(
            320,
            Math.min(
              Number(layout.readerHeightPx) || Number(layout.viewportHeightPx) || 640,
              Number(layout.viewportHeightPx) || 640
            )
          );
          const targetY = Math.max(120, Math.floor(viewportHeight * 0.35));

          for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const distance = Math.abs(rect.top - targetY);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPage = Number(node.getAttribute('data-page-number')) || bestPage;
            }
          }

          if (bestPage !== currentPage) {
            currentPage = bestPage;
            postMessage({ type: 'page-change', pageNumber: bestPage, isAutoScroll: true });
          }
        };

        const rerender = (requestedPage) => {
          if (!versePages.length) {
            statusNode.style.display = 'block';
            statusNode.textContent = 'No verse content found.';
            postMessage({ type: 'document-meta', pageCount: 0 });
            postMessage({ type: 'ready' });
            return;
          }

          statusNode.style.display = 'none';
          postMessage({ type: 'document-meta', pageCount: versePages.length });
          postMessage({
            type: 'verse-pages',
            pages: versePages.map((page, pageIndex) => ({
              pageNumber: pageIndex + 1,
              verseIds: page.map((verse) => String(verse.id)),
            })),
          });
          if (currentViewMode === 'continuous') {
            renderAllPages(requestedPage);
          } else {
            renderBookPage(requestedPage, true, 'none');
          }
          postVerseLayoutState();
        };

        const goToPage = (requestedPage) => {
          const targetPage = getSpreadAnchor(requestedPage);
          if (currentViewMode === 'continuous') {
            const target = document.getElementById('pdf-page-' + targetPage);
            if (target) {
              currentPage = targetPage;
              target.scrollIntoView({ block: 'start', behavior: 'smooth' });
              postMessage({ type: 'page-change', pageNumber: currentPage });
            }
            return;
          }
          if (targetPage === currentPage) return;
          if (
            layout.enablePageTurnEffect !== false &&
            turnPageFlipToPage(targetPage)
          ) {
            return;
          }
          renderBookPage(targetPage, false, targetPage > currentPage ? 'next' : 'prev');
        };

        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'continuous') return;
              const nextPage = clampPage(payload.page || currentPage);
              const previousMode = currentViewMode;
              const previousPage = currentPage;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              if (currentViewMode === 'continuous') {
                paginateVerses();
                renderAllPages(nextPage);
              } else {
                paginateVerses();
                const anchored = getSpreadAnchor(nextPage);
                const direction =
                  previousMode === 'book'
                    ? anchored > previousPage
                      ? 'next'
                      : anchored < previousPage
                        ? 'prev'
                        : 'none'
                    : 'none';
                renderBookPage(anchored, false, direction);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            goToPage(requested);
          } catch {
            // ignore malformed bridge payloads
          }
        };

        window.__PDF_READER_BRIDGE__ = {
          goToPage: (pageNumber) => {
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            goToPage(requested);
          },
          showMappedVerse: (pageNumber, verseId, isPlaying) => {
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            const targetPage = clampPage(requested);
            if (currentViewMode === 'book') {
              renderBookPage(targetPage, false, 'none');
              postMessage({ type: 'page-change', pageNumber: targetPage });
            } else {
              goToPage(targetPage);
            }
            window.requestAnimationFrame(() => {
              window.__PDF_READER_BRIDGE__.setActiveVerse(
                verseId,
                isPlaying,
                false
              );
            });
          },
          goToNextPage: () => {
            turnRelativeBookPage('next');
          },
          goToPreviousPage: () => {
            turnRelativeBookPage('prev');
          },
          setViewMode: (mode, page, anchorVerseId, zoom) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            const zoomChanged = applyZoomValue(zoom);
            if (zoomChanged) {
              paginateVerses();
            }
            const anchorPage = getVersePage(anchorVerseId);
            const anchorMatchesRequestedPage = anchorPage > 0 && anchorPage === clampPage(requestedPage);
            if (mode === currentViewMode) {
              if (mode === 'continuous') {
                const anchorNode = anchorMatchesRequestedPage
                  ? findVerseNode(anchorVerseId)
                  : null;
                if (anchorNode) {
                  currentPage = anchorPage;
                  anchorNode.scrollIntoView({ block: 'start' });
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                  return;
                }
              }
              if (zoomChanged) {
                rerender(requestedPage);
              } else if (mode === 'book') {
                renderBookPage(requestedPage, false, 'none');
              } else {
                goToPage(requestedPage);
              }
              return;
            }
            const previousMode = currentViewMode;
            const previousPage = currentPage;
            const visibleBookVerseId =
              previousMode === 'book'
                ? pagesNode
                    .querySelector('.page.active [data-verse-id]')
                    ?.getAttribute('data-verse-id') || ''
                : '';
            const visibleBookVersePage = getVersePage(visibleBookVerseId);
            const requestedAnchorPage = getVersePage(anchorVerseId);
            const requestedClampedPage = clampPage(requestedPage);
            const effectiveAnchorVerseId =
              visibleBookVersePage === requestedClampedPage
                ? visibleBookVerseId
                : requestedAnchorPage === requestedClampedPage
                  ? anchorVerseId || ''
                  : '';
            const effectiveAnchorPage = getVersePage(effectiveAnchorVerseId);
            const effectiveRequestedPage = effectiveAnchorPage > 0
              ? effectiveAnchorPage
              : requestedClampedPage;
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            paginateVerses();
            if (currentViewMode === 'continuous') {
              renderAllPages(
                effectiveRequestedPage,
                effectiveAnchorVerseId
              );
            } else {
              const anchored = getSpreadAnchor(effectiveRequestedPage);
              const direction =
                previousMode === 'book'
                  ? anchored > previousPage
                    ? 'next'
                    : anchored < previousPage
                      ? 'prev'
                      : 'none'
                  : 'none';
              renderBookPage(anchored, false, direction);
            }
          },
          setZoom: (zoom, page) => {
            const requestedPage = clampPage(page || currentPage);
            const anchorVerseId = String(
              versePages[requestedPage - 1]?.[0]?.id || ''
            );
            if (!applyZoomValue(zoom)) return;
            paginateVerses();
            const anchorPage = anchorVerseId
              ? versePages.findIndex((pageItems) =>
                  pageItems.some((verse) => String(verse.id) === anchorVerseId)
                ) + 1
              : requestedPage;
            rerender(clampPage(anchorPage > 0 ? anchorPage : requestedPage));
          },
          setActiveVerse: (verseId, isPlaying, shouldScroll) => {
            const safeVerseId = verseId === null || verseId === undefined ? '' : String(verseId);
            for (const node of Array.from(document.querySelectorAll('[data-verse-id]'))) {
              const isActive = safeVerseId && node.getAttribute('data-verse-id') === safeVerseId;
              node.classList.toggle('active-verse', Boolean(isActive));
              if (isActive && shouldScroll && currentViewMode === 'continuous') {
                node.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
            }
          }
        };

        window.addEventListener('message', handleBridgeEvent);
        document.addEventListener('message', handleBridgeEvent);
        let completeModeScrollRaf = 0;
        let completeModeScrollDebounce = 0;
        const handleScrollEvent = () => {
          if (currentViewMode !== 'continuous') {
            notifyInteraction();
            return;
          }
          if (completeModeScrollRaf) {
            window.cancelAnimationFrame(completeModeScrollRaf);
          }
          if (completeModeScrollDebounce) {
            window.clearTimeout(completeModeScrollDebounce);
          }
          completeModeScrollRaf = window.requestAnimationFrame(() => {
            completeModeScrollRaf = 0;
            updateCompleteModePage();
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            updateCompleteModePage();
            notifyInteraction();
          }, 120);
        };
        pagesNode.addEventListener('scroll', handleScrollEvent, { passive: true });
        window.addEventListener('scroll', handleScrollEvent, { passive: true });
        document.addEventListener('touchstart', (event) => {
          notifyInteraction();
          handleTouchStart(event);
        }, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        let resizeTimer = null;
        window.addEventListener('resize', () => {
          if (resizeTimer) {
            clearTimeout(resizeTimer);
          }
          resizeTimer = setTimeout(() => {
            paginateVerses();
            rerender(currentPage);
          }, 120);
        });

        applyViewModeLayout(currentViewMode);
        applyTypography();
        paginateVerses();
        rerender(initialPage);
      })();
    </script>
  </body>
</html>`;
};
function PdfDocumentViewer({
  pdfUrl,
  downloadUrl,
  enableLocalFallback = true,
  title,
  filename,
  documentId,
  currentPage,
  viewMode: controlledViewMode,
  zoomLevel: controlledZoomLevel,
  neighborPageCount = 3,
  loadingMessage = "loading content",
  onReady,
  onStateChange,
  onError,
  mode = "auto",
  verses,
  verseAudioMappings = [],
  verseLayout,
  renderRightActions,
  onFullScreenChange,
  readerTheme
}) {
  const [windowSize, setWindowSize] = react.useState(
    () => NativeDimensions?.get?.("window") || { width: 0, height: 0 }
  );
  const windowWidth = windowSize.width || 0;
  react.useEffect(() => {
    const subscription = NativeDimensions?.addEventListener?.(
      "change",
      ({ window }) => {
        setWindowSize(window);
      }
    );
    return () => {
      subscription?.remove?.();
    };
  }, []);
  const resolvedReaderTheme = react.useMemo(
    () => resolveReaderTheme(readerTheme),
    [readerTheme]
  );
  const verseZoomConfig = react.useMemo(() => {
    const min = Math.max(
      1,
      Math.round(Number(verseLayout?.minFontSizePx) || 18)
    );
    const max = Math.max(
      min,
      Math.round(Number(verseLayout?.maxFontSizePx) || 36)
    );
    const defaultSize = Math.max(
      min,
      Math.min(max, Math.round(Number(verseLayout?.defaultFontSizePx) || 22))
    );
    return {
      min,
      max,
      defaultSize,
      step: VERSE_BUTTON_ZOOM_STEP_PX
    };
  }, [
    verseLayout?.defaultFontSizePx,
    verseLayout?.maxFontSizePx,
    verseLayout?.minFontSizePx
  ]);
  const verseAudioPlayer = expoAudio.useAudioPlayer(null, { updateInterval: 120 });
  const verseAudioStatus = expoAudio.useAudioPlayerStatus(verseAudioPlayer);
  const [loadingError, setLoadingError] = react.useState(null);
  const [loadingPdf, setLoadingPdf] = react.useState(true);
  const [viewerReady, setViewerReady] = react.useState(false);
  const [downloadError, setDownloadError] = react.useState(null);
  const [downloading, setDownloading] = react.useState(false);
  const [pageCount, setPageCount] = react.useState(0);
  const requestedViewMode = controlledViewMode;
  const requestedZoomLevel = Math.max(
    MIN_ZOOM_LEVEL,
    Math.min(MAX_ZOOM_LEVEL, Number(controlledZoomLevel) || DEFAULT_ZOOM_LEVEL)
  );
  const initialViewModeRef = react.useRef(requestedViewMode);
  const initialZoomLevelRef = react.useRef(requestedZoomLevel);
  const [viewMode, setViewMode] = react.useState(requestedViewMode);
  const [zoomLevel, setZoomLevel] = react.useState(requestedZoomLevel);
  const [showShareOverlay, setShowShareOverlay] = react.useState(false);
  const [showOverlayControls, setShowOverlayControls] = react.useState(false);
  const [viewerReloadKey, setViewerReloadKey] = react.useState(0);
  const [localPdfUrl, setLocalPdfUrl] = react.useState(null);
  const [triedLocalFileFallback, setTriedLocalFileFallback] = react.useState(false);
  const [isVerseFullScreen, setIsVerseFullScreen] = react.useState(
    verseLayout?.fullScreen === true
  );
  const [verseFontSizePx, setVerseFontSizePx] = react.useState(() => {
    if (Number.isFinite(Number(controlledZoomLevel))) {
      return Math.max(
        verseZoomConfig.min,
        Math.min(
          verseZoomConfig.max,
          Math.round(verseZoomConfig.defaultSize * requestedZoomLevel)
        )
      );
    }
    return Math.max(
      verseZoomConfig.min,
      Math.min(
        verseZoomConfig.max,
        Math.round(verseZoomConfig.defaultSize * requestedZoomLevel)
      )
    );
  });
  const [activeVerseAudioIndex, setActiveVerseAudioIndex] = react.useState(null);
  const [activeVerseId, setActiveVerseId] = react.useState(null);
  const [readerVerseId, setReaderVerseId] = react.useState(null);
  const [currentVerseAudioUrl, setCurrentVerseAudioUrl] = react.useState(null);
  const [pendingVerseAudioSeekMs, setPendingVerseAudioSeekMs] = react.useState(null);
  const pendingVerseAudioAutoplayRef = react.useRef(true);
  const pendingAudioSeekTargetRef = react.useRef(null);
  const [versePageById, setVersePageById] = react.useState(
    {}
  );
  const [verseIdsByPage, setVerseIdsByPage] = react.useState({});
  const [audioSliderWidth, setAudioSliderWidth] = react.useState(1);
  const [viewerWrapHeight, setViewerWrapHeight] = react.useState(0);
  const [pdfBookViewerHeight, setPdfBookViewerHeight] = react.useState(480);
  const [bookVerseCanZoomIn, setBookVerseCanZoomIn] = react.useState(true);
  const effectiveVerseLayout = react.useMemo(() => {
    return verseLayout;
  }, [verseLayout]);
  const [bookSpreadMode, setBookSpreadMode] = react.useState(
    () => verseLayout?.bookSpreadMode === "double" && verseLayout?.showSecondPage !== false ? "double" : "single"
  );
  const visibleViewportHeight = Math.max(
    320,
    Math.floor(
      Number(effectiveVerseLayout?.viewportHeightPx) > 0 ? Number(effectiveVerseLayout?.viewportHeightPx) : 640
    )
  );
  const fullScreenViewportWidth = Math.max(
    320,
    Math.floor(
      Number(effectiveVerseLayout?.viewportWidthPx) > 0 ? Number(effectiveVerseLayout?.viewportWidthPx) : windowWidth || 360
    )
  );
  const fullScreenViewportHeight = visibleViewportHeight;
  const isFullScreenLandscape = fullScreenViewportWidth > fullScreenViewportHeight;
  const isEmbeddedLandscape = !isVerseFullScreen && fullScreenViewportWidth > fullScreenViewportHeight;
  const verseViewerHeight = Math.max(
    320,
    isVerseFullScreen ? visibleViewportHeight : Math.floor(effectiveVerseLayout?.readerHeightPx || 480)
  );
  const maxPdfBookViewerHeight = Math.max(
    320,
    Math.floor(visibleViewportHeight * 0.8)
  );
  const completeViewerHeight = isVerseFullScreen ? visibleViewportHeight : verseViewerHeight;
  const webViewRef = react.useRef(null);
  const fullScreenWebViewRef = react.useRef(null);
  const completeScrollRef = react.useRef(null);
  const completeVerseYByIdRef = react.useRef({});
  const pendingCompleteScrollVerseIdRef = react.useRef(null);
  const userDraggingCompleteScrollRef = react.useRef(false);
  const completeRestoreTimerRef = react.useRef(
    null
  );
  const completeRestoreGuardUntilRef = react.useRef(0);
  const staticServerRef = react.useRef(null);
  const overlayTimerRef = react.useRef(null);
  const suppressCompleteModeSyncRef = react.useRef(false);
  const pendingModeSwitchPageRef = react.useRef(null);
  const programmaticViewerSyncRef = react.useRef(null);
  const lastSyncedViewModeRef = react.useRef(null);
  const lastInjectedViewerStateRef = react.useRef(null);
  const lastAudioVerseWebSyncRef = react.useRef(null);
  const lastEmittedFullScreenRef = react.useRef(null);
  const pageCountRef = react.useRef(0);
  const lastNativeReadyPageCountRef = react.useRef(0);
  const onReadyRef = react.useRef(onReady);
  const versePagesSignatureRef = react.useRef("");
  const pageNumberRef = react.useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0 ? Math.trunc(Number(currentPage)) : 1
  );
  const viewModeRef = react.useRef(requestedViewMode);
  const zoomLevelRef = react.useRef(requestedZoomLevel);
  const previousPdfUrlRef = react.useRef(pdfUrl);
  const lastEmittedReaderStateRef = react.useRef(null);
  const hasVerseContent = Boolean(verses?.length);
  const contentMode = mode === "verse" ? "verse" : mode === "pdf" ? "pdf" : hasVerseContent ? "verse" : "pdf";
  const useNativeFullScreenOverlay = contentMode === "verse" && isVerseFullScreen;
  const useFullScreenBookWebView = useNativeFullScreenOverlay && viewMode === "book";
  const useNativeFullScreenBookView = useNativeFullScreenOverlay && viewMode === "book" && !useFullScreenBookWebView;
  const suppressInlineReaderSurface = useNativeFullScreenBookView || ReactNative.Platform.OS === "ios" && useFullScreenBookWebView;
  const inlineFullScreenActive = contentMode === "verse" && isVerseFullScreen && !useNativeFullScreenOverlay;
  const viewerHeight = contentMode === "pdf" && viewMode === "book" ? Math.min(maxPdfBookViewerHeight, pdfBookViewerHeight) : completeViewerHeight;
  const useNativeCompleteVerseView = contentMode === "verse" && viewMode === "continuous" && !isVerseFullScreen;
  const useNativeBookVerseView = contentMode === "verse" && viewMode === "book" && !isVerseFullScreen;
  const useNativeVerseView = useNativeCompleteVerseView || useNativeBookVerseView;
  const useNativeVersePaging = useNativeVerseView || useNativeFullScreenOverlay;
  const autoAlignCurrentVerse = effectiveVerseLayout?.autoAlignCurrentVerse !== false;
  const highlightCurrentVerse = effectiveVerseLayout?.highlightCurrentVerse !== false;
  const allowBookDoubleSpread = effectiveVerseLayout?.allowDoubleSpread !== false;
  const activeBookSpreadMode = allowBookDoubleSpread && bookSpreadMode === "double" ? "double" : "single";
  const effectiveBookVerseLayout = react.useMemo(() => {
    if (contentMode !== "verse") return effectiveVerseLayout;
    return {
      ...effectiveVerseLayout,
      bookSpreadMode: activeBookSpreadMode,
      showSecondPage: activeBookSpreadMode === "double"
    };
  }, [activeBookSpreadMode, contentMode, effectiveVerseLayout]);
  const playableVerseMappings = react.useMemo(
    () => (verseAudioMappings || []).filter((mapping) => {
      const startMs = Number(mapping.segmentStartMs);
      const endMs = Number(mapping.segmentEndMs);
      return mapping?.audioAssetUrl && mapping.verseId !== null && mapping.verseId !== void 0 && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
    }).map((mapping, index) => ({
      ...mapping,
      id: String(mapping.id || mapping.verseId),
      verseId: String(mapping.verseId),
      audioAssetUrl: String(mapping.audioAssetUrl),
      label: mapping.label || `Verse ${index + 1}`,
      segmentStartMs: Math.max(
        0,
        Math.floor(Number(mapping.segmentStartMs))
      ),
      segmentEndMs: Math.max(0, Math.floor(Number(mapping.segmentEndMs))),
      sortOrder: Number.isFinite(Number(mapping.sortOrder)) ? Number(mapping.sortOrder) : index
    })).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [verseAudioMappings]
  );
  const hasVerseAudio = contentMode === "verse" && playableVerseMappings.length > 0;
  const mappedVerseIds = react.useMemo(
    () => playableVerseMappings.map((mapping) => String(mapping.verseId)),
    [playableVerseMappings]
  );
  const completeVerses = react.useMemo(
    () => (verses || []).filter((verse) => String(verse?.content || "").trim()).map((verse, index) => ({
      ...verse,
      id: String(verse.id),
      label: verse.label || `Verse ${index + 1}`,
      contentHtml: String(verse.content || ""),
      contentText: stripHtmlText(verse.content)
    })),
    [verses]
  );
  if (useNativeCompleteVerseView && pageNumberRef.current > 1 && !pendingCompleteScrollVerseIdRef.current) {
    const pageVerseId = completeVerses[pageNumberRef.current - 1]?.id || null;
    const readerVersePage = readerVerseId && useNativeVersePaging ? completeVerses.findIndex((verse) => verse.id === readerVerseId) + 1 : 0;
    const pendingVerseId = readerVersePage === pageNumberRef.current ? readerVerseId : pageVerseId;
    if (pendingVerseId) {
      pendingCompleteScrollVerseIdRef.current = pendingVerseId;
    }
  }
  const resolvedDownloadUrl = downloadUrl || pdfUrl || "";
  const label = filename?.trim() || title?.trim() || (contentMode === "verse" ? "Verse document" : "PDF document");
  const shareUrl = (downloadUrl || pdfUrl || "").trim();
  documentId?.trim() || (contentMode === "verse" ? `verse:${label}` : pdfUrl || label);
  const showHeaderControls = !isVerseFullScreen;
  const initialPageRef = react.useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0 ? Math.trunc(Number(currentPage)) : 1
  );
  const externalInitialPageNumber = initialPageRef.current;
  react.useEffect(() => {
    setIsVerseFullScreen(verseLayout?.fullScreen === true);
  }, [verseLayout?.fullScreen]);
  react.useEffect(() => {
    if (contentMode !== "verse") return;
    if (viewMode === "book") {
      setIsVerseFullScreen(true);
      return;
    }
    if (verseLayout?.fullScreen !== true) {
      setIsVerseFullScreen(false);
    }
  }, [contentMode, verseLayout?.fullScreen, viewMode]);
  react.useEffect(() => {
    if (allowBookDoubleSpread) return;
    setBookSpreadMode("single");
  }, [allowBookDoubleSpread]);
  react.useEffect(() => {
    const nextFullScreen = contentMode === "verse" && isVerseFullScreen;
    if (lastEmittedFullScreenRef.current === nextFullScreen) return;
    lastEmittedFullScreenRef.current = nextFullScreen;
    onFullScreenChange?.(nextFullScreen);
  }, [contentMode, isVerseFullScreen, onFullScreenChange]);
  react.useEffect(() => {
    if (contentMode === "verse" && showShareOverlay) {
      setShowShareOverlay(false);
    }
  }, [contentMode, showShareOverlay]);
  const stopStaticServer = react.useCallback(async () => {
    const current = staticServerRef.current;
    if (!current || typeof current.stop !== "function") {
      staticServerRef.current = null;
      return;
    }
    try {
      await current.stop();
    } catch {
    } finally {
      staticServerRef.current = null;
    }
  }, []);
  const [pageNumber, setPageNumber] = react.useState(externalInitialPageNumber);
  const isPageHydrated = true;
  react.useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);
  react.useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);
  react.useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);
  react.useEffect(() => {
    const nextState = {
      currentPage: pageNumber,
      pageCount,
      viewMode,
      zoomLevel,
      readerVerseId
    };
    const serialized = JSON.stringify(nextState);
    if (lastEmittedReaderStateRef.current === serialized) return;
    lastEmittedReaderStateRef.current = serialized;
    onStateChange(nextState);
  }, [
    isPageHydrated,
    onStateChange,
    pageCount,
    pageNumber,
    readerVerseId,
    viewMode,
    zoomLevel
  ]);
  react.useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount]);
  react.useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const scrollCompleteToVerse = react.useCallback(
    (verseId, animated = false) => {
      if (!verseId) return false;
      const y = completeVerseYByIdRef.current[verseId];
      if (!Number.isFinite(y)) {
        pendingCompleteScrollVerseIdRef.current = verseId;
        return false;
      }
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      completeScrollRef.current?.scrollTo({
        y: Math.max(0, y - 12),
        animated
      });
      setTimeout(() => {
        completeScrollRef.current?.scrollTo({
          y: Math.max(0, y - 12),
          animated: false
        });
      }, 120);
      setTimeout(() => {
        if (pendingCompleteScrollVerseIdRef.current === verseId) {
          pendingCompleteScrollVerseIdRef.current = null;
        }
      }, 760);
      return true;
    },
    []
  );
  const getNativeVersePage = react.useCallback(
    (verseId) => {
      if (!verseId) return 0;
      const mappedPage = versePageById[verseId];
      if (mappedPage) return mappedPage;
      if (!useNativeVersePaging) return 0;
      const verseIndex = completeVerses.findIndex(
        (verse) => verse.id === verseId
      );
      return verseIndex >= 0 ? verseIndex + 1 : 0;
    },
    [completeVerses, useNativeVersePaging, versePageById]
  );
  const updateCompleteAnchorFromOffset = react.useCallback(
    (offsetY) => {
      let bestVerseId = null;
      let bestDistance = Infinity;
      const targetY = Math.max(0, offsetY + 24);
      for (const [verseId, y] of Object.entries(
        completeVerseYByIdRef.current
      )) {
        const distance = Math.abs(y - targetY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestVerseId = verseId;
        }
      }
      if (bestVerseId) {
        setReaderVerseId(
          (current) => current === bestVerseId ? current : bestVerseId
        );
        const pageForVerse = getNativeVersePage(bestVerseId);
        if (pageForVerse && pageForVerse !== pageNumber) {
          pageNumberRef.current = pageForVerse;
          void setPageNumber(pageForVerse);
        }
      }
    },
    [getNativeVersePage, pageNumber, setPageNumber]
  );
  const handleCompleteScrollBeginDrag = react.useCallback(() => {
    userDraggingCompleteScrollRef.current = true;
    pendingCompleteScrollVerseIdRef.current = null;
    completeRestoreGuardUntilRef.current = 0;
  }, []);
  const handleCompleteScrollEndDrag = react.useCallback(
    (event) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateCompleteAnchorFromOffset]
  );
  const handleCompleteMomentumScrollEnd = react.useCallback(
    (event) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateCompleteAnchorFromOffset]
  );
  react.useEffect(() => {
    if (contentMode !== "verse" || !isPageHydrated) return;
    const pageVerses = verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id ? [completeVerses[pageNumber - 1].id] : void 0);
    const firstVerseId = pageVerses?.[0];
    if (!firstVerseId) return;
    setReaderVerseId(
      (current) => current === firstVerseId ? current : firstVerseId
    );
  }, [
    completeVerses,
    contentMode,
    isPageHydrated,
    pageNumber,
    useNativeVersePaging,
    verseIdsByPage
  ]);
  react.useEffect(() => {
    if (contentMode !== "verse" || viewMode !== "continuous") return;
    if (!autoAlignCurrentVerse) return;
    const pageVerses = verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id ? [completeVerses[pageNumber - 1].id] : void 0);
    if (pageNumber > 1 && (!pageVerses || pageVerses.length === 0)) {
      return;
    }
    const readerVerseBelongsToPage = readerVerseId && pageVerses?.includes(readerVerseId);
    const targetVerseId = readerVerseBelongsToPage ? readerVerseId : pageVerses?.[0] || completeVerses[0]?.id || null;
    if (!targetVerseId) return;
    if (completeRestoreTimerRef.current) {
      clearTimeout(completeRestoreTimerRef.current);
    }
    pendingCompleteScrollVerseIdRef.current = targetVerseId;
    completeRestoreGuardUntilRef.current = Date.now() + 900;
    completeRestoreTimerRef.current = setTimeout(() => {
      scrollCompleteToVerse(targetVerseId, false);
    }, 80);
    return () => {
      if (completeRestoreTimerRef.current) {
        clearTimeout(completeRestoreTimerRef.current);
        completeRestoreTimerRef.current = null;
      }
    };
  }, [
    autoAlignCurrentVerse,
    completeVerses,
    contentMode,
    isPageHydrated,
    pageNumber,
    readerVerseId,
    scrollCompleteToVerse,
    useNativeVersePaging,
    verseFontSizePx,
    verseIdsByPage,
    viewMode
  ]);
  react.useEffect(() => {
    if (previousPdfUrlRef.current === pdfUrl) return;
    previousPdfUrlRef.current = pdfUrl;
    void (async () => {
      await stopStaticServer();
    })();
    setPageCount(0);
    setLoadingError(null);
    setLoadingPdf(true);
    setViewerReady(false);
    setLocalPdfUrl(null);
    setTriedLocalFileFallback(false);
    setViewerReloadKey((value) => value + 1);
  }, [pdfUrl, stopStaticServer]);
  react.useEffect(() => {
    return () => {
      void (async () => {
        await stopStaticServer();
      })();
    };
  }, [stopStaticServer]);
  react.useEffect(() => {
    const nextMode = controlledViewMode;
    viewModeRef.current = nextMode;
    setViewMode((value) => value === nextMode ? value : nextMode);
  }, [controlledViewMode]);
  react.useEffect(() => {
    if (!Number.isFinite(Number(controlledZoomLevel))) return;
    const nextZoom = Math.max(
      MIN_ZOOM_LEVEL,
      Math.min(MAX_ZOOM_LEVEL, Number(controlledZoomLevel))
    );
    zoomLevelRef.current = nextZoom;
    setZoomLevel((value) => value === nextZoom ? value : nextZoom);
    if (contentMode === "verse") {
      setVerseFontSizePx(
        Math.max(
          verseZoomConfig.min,
          Math.min(
            verseZoomConfig.max,
            Math.round(verseZoomConfig.defaultSize * nextZoom)
          )
        )
      );
    }
  }, [
    contentMode,
    controlledZoomLevel,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.min
  ]);
  react.useEffect(() => {
    if (!useNativeVersePaging) return;
    const nextPageCount = Math.max(1, completeVerses.length);
    pageCountRef.current = nextPageCount;
    setPageCount((value) => value === nextPageCount ? value : nextPageCount);
    setLoadingPdf(false);
    setViewerReady(true);
    if (lastNativeReadyPageCountRef.current !== nextPageCount) {
      lastNativeReadyPageCountRef.current = nextPageCount;
      onReadyRef.current?.({ pageCount: nextPageCount });
    }
    const currentPage2 = pageNumberRef.current || pageNumber;
    if (currentPage2 > nextPageCount) {
      pageNumberRef.current = nextPageCount;
      void setPageNumber(nextPageCount);
    }
  }, [completeVerses.length, useNativeVersePaging]);
  react.useEffect(() => {
    setVerseFontSizePx((value) => {
      const next = Math.max(
        verseZoomConfig.min,
        Math.min(verseZoomConfig.max, value)
      );
      return next;
    });
  }, [verseZoomConfig.max, verseZoomConfig.min]);
  const downloadName = react.useMemo(() => {
    const normalized = label.replace(/[\\/:*?"<>|]/g, "_").trim() || "document";
    return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`;
  }, [label]);
  const effectivePdfUrl = localPdfUrl || pdfUrl;
  const usesLocalFileFallback = Boolean(localPdfUrl?.startsWith("file://"));
  const verseLayoutSignature = JSON.stringify(effectiveBookVerseLayout || null);
  const pdfHtml = react.useMemo(
    () => contentMode === "verse" ? buildVerseHtml(
      verses || [],
      label,
      pageNumberRef.current || externalInitialPageNumber || 1,
      viewMode,
      effectiveBookVerseLayout,
      {
        fontSizePx: Math.round(
          verseZoomConfig.defaultSize * initialZoomLevelRef.current
        ),
        minFontSizePx: verseZoomConfig.min,
        defaultFontSizePx: verseZoomConfig.defaultSize,
        maxFontSizePx: verseZoomConfig.max
      },
      mappedVerseIds,
      "single",
      false,
      resolvedReaderTheme
    ) : buildPdfHtml(
      effectivePdfUrl || "",
      label,
      externalInitialPageNumber || 1,
      initialViewModeRef.current,
      initialZoomLevelRef.current,
      neighborPageCount,
      maxPdfBookViewerHeight
    ),
    [
      contentMode,
      effectivePdfUrl,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verses,
      viewerReloadKey,
      neighborPageCount,
      maxPdfBookViewerHeight,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verseZoomConfig.defaultSize,
      verseLayoutSignature,
      resolvedReaderTheme
    ]
  );
  const webViewSource = react.useMemo(() => {
    return { html: pdfHtml };
  }, [pdfHtml]);
  const fullScreenVerseHtml = react.useMemo(
    () => contentMode === "verse" ? buildVerseHtml(
      verses || [],
      label,
      pageNumberRef.current || externalInitialPageNumber || 1,
      viewMode,
      {
        ...effectiveBookVerseLayout,
        fullScreen: true,
        readerHeightPx: visibleViewportHeight
      },
      {
        fontSizePx: verseFontSizePx,
        minFontSizePx: verseZoomConfig.min,
        defaultFontSizePx: verseZoomConfig.defaultSize,
        maxFontSizePx: verseZoomConfig.max
      },
      mappedVerseIds,
      activeBookSpreadMode,
      activeBookSpreadMode === "double",
      resolvedReaderTheme
    ) : "",
    [
      contentMode,
      activeBookSpreadMode,
      effectiveBookVerseLayout,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verseFontSizePx,
      verseZoomConfig.defaultSize,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verses,
      visibleViewportHeight,
      viewMode,
      resolvedReaderTheme
    ]
  );
  const fullScreenWebViewSource = react.useMemo(
    () => ({ html: fullScreenVerseHtml }),
    [fullScreenVerseHtml]
  );
  const showOverlay = react.useCallback(() => {
    setShowOverlayControls(true);
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlayControls(false);
    }, 2600);
  }, []);
  const syncActiveVerseToWebView = react.useCallback(
    (verseId, isPlaying = false, shouldScroll = false) => {
      const safeVerseId = verseId ? escapeJsString(verseId) : "";
      const script = `
      (function() {
        if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setActiveVerse === 'function') {
          window.__PDF_READER_BRIDGE__.setActiveVerse('${safeVerseId}', ${isPlaying ? "true" : "false"}, ${shouldScroll ? "true" : "false"});
        }
      })();
      true;
    `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
    },
    []
  );
  const showMappedVerse = react.useCallback(
    (verseId, options) => {
      const pageForVerse = getNativeVersePage(verseId);
      if (!pageForVerse) return;
      pageNumberRef.current = pageForVerse;
      pendingModeSwitchPageRef.current = pageForVerse;
      pendingCompleteScrollVerseIdRef.current = verseId;
      void setPageNumber(pageForVerse);
      setReaderVerseId((current) => current === verseId ? current : verseId);
      setActiveVerseId((current) => current === verseId ? current : verseId);
      const bridgeMethod = viewMode === "book" ? "showMappedVerse" : "goToPage";
      const bridgeArgs = viewMode === "book" ? `${pageForVerse}, '${escapeJsString(verseId)}', ${options?.isPlaying ? "true" : "false"}` : String(pageForVerse);
      const script = `
        (function() {
          if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.${bridgeMethod} === 'function') {
            window.__PDF_READER_BRIDGE__.${bridgeMethod}(${bridgeArgs});
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
      if (useNativeCompleteVerseView || useNativeFullScreenOverlay) {
        void scrollCompleteToVerse(verseId, options?.animated ?? true);
      }
      syncActiveVerseToWebView(verseId, options?.isPlaying ?? false, true);
    },
    [
      getNativeVersePage,
      scrollCompleteToVerse,
      setPageNumber,
      syncActiveVerseToWebView,
      useNativeCompleteVerseView,
      useNativeFullScreenOverlay,
      viewMode
    ]
  );
  const activateVerseAudioIndex = react.useCallback(
    (targetIndex, options) => {
      const item = playableVerseMappings[targetIndex];
      if (!item) return;
      const autoplay = options?.autoplay ?? true;
      const verseId = String(item.verseId);
      pendingAudioSeekTargetRef.current = {
        index: targetIndex,
        audioAssetUrl: item.audioAssetUrl,
        expiresAt: Date.now() + 2500
      };
      setActiveVerseAudioIndex(targetIndex);
      showMappedVerse(verseId, { isPlaying: autoplay, animated: true });
      const startPlayback = () => {
        setPendingVerseAudioSeekMs(null);
        void verseAudioPlayer.seekTo(item.segmentStartMs / 1e3).then(() => {
          if (autoplay) {
            try {
              verseAudioPlayer.play();
            } catch {
            }
          }
        });
      };
      if (currentVerseAudioUrl !== item.audioAssetUrl) {
        try {
          verseAudioPlayer.pause();
          verseAudioPlayer.replace(item.audioAssetUrl);
          setCurrentVerseAudioUrl(item.audioAssetUrl);
          pendingVerseAudioAutoplayRef.current = autoplay;
          setPendingVerseAudioSeekMs(item.segmentStartMs);
        } catch {
          setPendingVerseAudioSeekMs(null);
        }
        showOverlay();
        return;
      }
      startPlayback();
      showOverlay();
    },
    [
      currentVerseAudioUrl,
      playableVerseMappings,
      showMappedVerse,
      showOverlay,
      verseAudioPlayer
    ]
  );
  const toggleVerseAudio = react.useCallback(() => {
    if (!hasVerseAudio) return;
    if (verseAudioStatus.playing) {
      try {
        verseAudioPlayer.pause();
      } catch {
      }
      showOverlay();
      return;
    }
    if (activeVerseAudioIndex !== null) {
      const activeItem = playableVerseMappings[activeVerseAudioIndex];
      const activeVerseId2 = activeItem ? String(activeItem.verseId) : null;
      if (activeVerseId2) {
        const pageForVerse = getNativeVersePage(activeVerseId2);
        setActiveVerseId(activeVerseId2);
        setReaderVerseId(
          (current) => current === activeVerseId2 ? current : activeVerseId2
        );
        if (viewMode !== "book" && pageForVerse && pageForVerse !== pageNumber) {
          pageNumberRef.current = pageForVerse;
          void setPageNumber(pageForVerse);
          const script = `
            (function() {
              if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.goToPage === 'function') {
                window.__PDF_READER_BRIDGE__.goToPage(${pageForVerse});
              }
            })();
            true;
          `;
          webViewRef.current?.injectJavaScript(script);
          fullScreenWebViewRef.current?.injectJavaScript(script);
        }
        if (useNativeCompleteVerseView || useNativeFullScreenOverlay) {
          void scrollCompleteToVerse(activeVerseId2, true);
        }
        syncActiveVerseToWebView(activeVerseId2, true, viewMode !== "book");
      }
      try {
        verseAudioPlayer.play();
      } catch {
      }
      showOverlay();
      return;
    }
    activateVerseAudioIndex(0);
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    playableVerseMappings,
    scrollCompleteToVerse,
    setPageNumber,
    showOverlay,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    verseAudioPlayer,
    verseAudioStatus.playing,
    viewMode
  ]);
  const seekActiveVerseAudioToRatio = react.useCallback(
    (ratio) => {
      if (!hasVerseAudio || activeVerseAudioIndex === null) return;
      const item = playableVerseMappings[activeVerseAudioIndex];
      if (!item) return;
      const boundedRatio = Math.max(0, Math.min(1, ratio));
      const statusTrackDurationSeconds = Math.max(
        0,
        Number(
          verseAudioStatus.duration ?? verseAudioStatus.durationSeconds ?? 0
        )
      );
      const mappedTrackDurationMs = playableVerseMappings.filter((mapping) => mapping.audioAssetUrl === item.audioAssetUrl).reduce(
        (maxEndMs, mapping) => Math.max(maxEndMs, mapping.segmentEndMs),
        0
      );
      const loadedTrackDurationMs = Math.max(
        0,
        Math.floor(statusTrackDurationSeconds * 1e3)
      );
      const trackDurationMs = Math.max(
        loadedTrackDurationMs,
        mappedTrackDurationMs
      );
      if (trackDurationMs <= 0) return;
      const nextMs = Math.floor(trackDurationMs * boundedRatio);
      const matchedSeekIndex = playableVerseMappings.findIndex((mapping) => {
        if (mapping.audioAssetUrl !== item.audioAssetUrl) return false;
        return nextMs >= mapping.segmentStartMs && nextMs < mapping.segmentEndMs;
      });
      if (matchedSeekIndex >= 0) {
        const matchedSeek = playableVerseMappings[matchedSeekIndex];
        const verseId = String(matchedSeek.verseId);
        pendingAudioSeekTargetRef.current = {
          index: matchedSeekIndex,
          audioAssetUrl: matchedSeek.audioAssetUrl,
          expiresAt: Date.now() + 2500
        };
        setActiveVerseAudioIndex(matchedSeekIndex);
        showMappedVerse(verseId, {
          isPlaying: verseAudioStatus.playing,
          animated: true
        });
      }
      void verseAudioPlayer.seekTo(nextMs / 1e3);
      showOverlay();
    },
    [
      activeVerseAudioIndex,
      hasVerseAudio,
      playableVerseMappings,
      showMappedVerse,
      showOverlay,
      verseAudioPlayer,
      verseAudioStatus
    ]
  );
  react.useEffect(() => {
    if (!hasVerseAudio) {
      setActiveVerseAudioIndex(null);
      setActiveVerseId(null);
      setCurrentVerseAudioUrl(null);
      setPendingVerseAudioSeekMs(null);
      lastAudioVerseWebSyncRef.current = null;
      syncActiveVerseToWebView(null, false);
      return;
    }
    return () => {
      try {
        verseAudioPlayer.pause();
      } catch {
      }
    };
  }, [hasVerseAudio, syncActiveVerseToWebView, verseAudioPlayer]);
  react.useEffect(() => {
    if (!hasVerseAudio || pendingVerseAudioSeekMs === null) return;
    if (!verseAudioStatus.isLoaded) return;
    const targetMs = pendingVerseAudioSeekMs;
    const shouldPlayAfterSeek = pendingVerseAudioAutoplayRef.current;
    setPendingVerseAudioSeekMs(null);
    void verseAudioPlayer.seekTo(targetMs / 1e3).then(() => {
      if (!shouldPlayAfterSeek) return;
      try {
        verseAudioPlayer.play();
      } catch {
      }
    });
  }, [
    hasVerseAudio,
    pendingVerseAudioSeekMs,
    verseAudioPlayer,
    verseAudioStatus.isLoaded
  ]);
  react.useEffect(() => {
    if (!hasVerseAudio || !verseAudioStatus.isLoaded || !currentVerseAudioUrl)
      return;
    const currentMs = Math.max(
      0,
      Math.floor((verseAudioStatus.currentTime || 0) * 1e3)
    );
    const pendingAudioSeekTarget = pendingAudioSeekTargetRef.current;
    if (pendingAudioSeekTarget) {
      const pendingItem = playableVerseMappings[pendingAudioSeekTarget.index];
      const isSameAudio = pendingItem && pendingAudioSeekTarget.audioAssetUrl === currentVerseAudioUrl && pendingItem.audioAssetUrl === currentVerseAudioUrl;
      const isWithinPendingSegment = isSameAudio && currentMs >= pendingItem.segmentStartMs && currentMs < pendingItem.segmentEndMs;
      if (isWithinPendingSegment || Date.now() >= pendingAudioSeekTarget.expiresAt) {
        pendingAudioSeekTargetRef.current = null;
      } else if (isSameAudio) {
        return;
      }
    }
    const matchedIndex = playableVerseMappings.findIndex((item) => {
      if (item.audioAssetUrl !== currentVerseAudioUrl) return false;
      return currentMs >= item.segmentStartMs && currentMs < item.segmentEndMs;
    });
    if (matchedIndex >= 0) {
      const matched = playableVerseMappings[matchedIndex];
      const verseId = String(matched.verseId);
      const pageForVerse = getNativeVersePage(verseId);
      const verseChanged = activeVerseAudioIndex !== matchedIndex;
      if (activeVerseAudioIndex !== matchedIndex) {
        setActiveVerseAudioIndex(matchedIndex);
      }
      if (activeVerseId !== verseId) {
        setActiveVerseId(verseId);
      }
      if (readerVerseId !== verseId) {
        setReaderVerseId(verseId);
      }
      const shouldFollowAudioPage = viewMode !== "book" || verseChanged || activeVerseAudioIndex === null;
      if (shouldFollowAudioPage && pageForVerse && (viewMode === "book" || pageForVerse !== pageNumber)) {
        const bridgeMethod = viewMode === "book" ? "showMappedVerse" : "goToPage";
        const bridgeArgs = viewMode === "book" ? `${pageForVerse}, '${escapeJsString(verseId)}', ${verseAudioStatus.playing ? "true" : "false"}` : String(pageForVerse);
        const script = `
          (function() {
            if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.${bridgeMethod} === 'function') {
              window.__PDF_READER_BRIDGE__.${bridgeMethod}(${bridgeArgs});
            }
          })();
          true;
        `;
        webViewRef.current?.injectJavaScript(script);
        fullScreenWebViewRef.current?.injectJavaScript(script);
        if (viewMode !== "book") {
          pageNumberRef.current = pageForVerse;
          void setPageNumber(pageForVerse);
        }
      }
      if (verseChanged && (useNativeCompleteVerseView || useNativeFullScreenOverlay)) {
        void scrollCompleteToVerse(verseId, true);
      }
      if (verseChanged || lastAudioVerseWebSyncRef.current !== verseId) {
        lastAudioVerseWebSyncRef.current = verseId;
        syncActiveVerseToWebView(
          verseId,
          verseAudioStatus.playing,
          verseChanged
        );
      }
      return;
    }
    if (activeVerseAudioIndex === null) return;
    const activeItem = playableVerseMappings[activeVerseAudioIndex];
    if (!activeItem || activeItem.audioAssetUrl !== currentVerseAudioUrl)
      return;
    if (currentMs < activeItem.segmentEndMs) return;
    const nextIndex = activeVerseAudioIndex + 1;
    if (nextIndex < playableVerseMappings.length) {
      activateVerseAudioIndex(nextIndex);
      return;
    }
    try {
      verseAudioPlayer.pause();
      void verseAudioPlayer.seekTo(activeItem.segmentEndMs / 1e3);
    } catch {
    }
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    activeVerseId,
    currentVerseAudioUrl,
    getNativeVersePage,
    hasVerseAudio,
    playableVerseMappings,
    pageNumber,
    readerVerseId,
    scrollCompleteToVerse,
    setPageNumber,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    verseAudioPlayer,
    verseAudioStatus.currentTime,
    verseAudioStatus.isLoaded,
    verseAudioStatus.playing,
    viewMode
  ]);
  react.useEffect(() => {
    if (!viewerReady || contentMode !== "verse") return;
    syncActiveVerseToWebView(activeVerseId, verseAudioStatus.playing, false);
  }, [
    activeVerseId,
    contentMode,
    syncActiveVerseToWebView,
    verseAudioStatus.playing,
    viewerReady,
    viewMode
  ]);
  const adjustVerseFontSize = react.useCallback(
    (deltaSteps) => {
      if (!Number.isFinite(deltaSteps) || deltaSteps === 0) return;
      if (deltaSteps > 0 && viewMode === "book" && bookVerseCanZoomIn === false) {
        showOverlay();
        return;
      }
      setVerseFontSizePx((value) => {
        const next = Math.max(
          verseZoomConfig.min,
          Math.min(
            verseZoomConfig.max,
            value + deltaSteps * VERSE_GESTURE_ZOOM_STEP_PX
          )
        );
        const nextZoom = next / verseZoomConfig.defaultSize;
        zoomLevelRef.current = nextZoom;
        setZoomLevel(nextZoom);
        return next;
      });
      showOverlay();
    },
    [
      bookVerseCanZoomIn,
      showOverlay,
      verseZoomConfig.defaultSize,
      verseZoomConfig.max,
      verseZoomConfig.min,
      viewMode
    ]
  );
  const zoomOutVerse = react.useCallback(() => {
    setBookVerseCanZoomIn(true);
    setVerseFontSizePx((value) => {
      const next = Math.max(verseZoomConfig.min, value - verseZoomConfig.step);
      const nextZoom = next / verseZoomConfig.defaultSize;
      zoomLevelRef.current = nextZoom;
      setZoomLevel(nextZoom);
      return next;
    });
    showOverlay();
  }, [
    showOverlay,
    verseZoomConfig.defaultSize,
    verseZoomConfig.min,
    verseZoomConfig.step
  ]);
  const zoomInVerse = react.useCallback(() => {
    if (viewMode === "book" && bookVerseCanZoomIn === false) {
      showOverlay();
      return;
    }
    setVerseFontSizePx((value) => {
      const next = Math.min(verseZoomConfig.max, value + verseZoomConfig.step);
      const nextZoom = next / verseZoomConfig.defaultSize;
      zoomLevelRef.current = nextZoom;
      setZoomLevel(nextZoom);
      return next;
    });
    showOverlay();
  }, [
    bookVerseCanZoomIn,
    showOverlay,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.step,
    viewMode
  ]);
  const adjustPdfZoom = react.useCallback(
    (delta) => {
      setZoomLevel((value) => {
        const nextZoom = Math.max(
          MIN_ZOOM_LEVEL,
          Math.min(MAX_ZOOM_LEVEL, Math.round((value + delta) * 100) / 100)
        );
        zoomLevelRef.current = nextZoom;
        return nextZoom;
      });
      showOverlay();
    },
    [showOverlay]
  );
  const handleFullScreenWebViewMessage = react.useCallback(
    (event) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data || "{}");
        if (payload?.type === "document-meta") {
          const nextPageCount = Number(payload.pageCount);
          if (Number.isInteger(nextPageCount) && nextPageCount > 0) {
            pageCountRef.current = nextPageCount;
            setPageCount(
              (current) => current === nextPageCount ? current : nextPageCount
            );
          }
          return;
        }
        if (payload?.type === "verse-pages") {
          const nextPageById = {};
          const nextIdsByPage = {};
          const pages = Array.isArray(payload.pages) ? payload.pages : [];
          const nextSignature = JSON.stringify(pages);
          if (versePagesSignatureRef.current === nextSignature) return;
          versePagesSignatureRef.current = nextSignature;
          for (const page of pages) {
            const pageNumberValue = Number(page?.pageNumber);
            if (!Number.isInteger(pageNumberValue) || pageNumberValue <= 0) {
              continue;
            }
            const verseIds = Array.isArray(page?.verseIds) ? page.verseIds : [];
            nextIdsByPage[pageNumberValue] = verseIds.map(
              (verseId) => String(verseId)
            );
            for (const verseId of verseIds) {
              nextPageById[String(verseId)] = pageNumberValue;
            }
          }
          setVersePageById(nextPageById);
          setVerseIdsByPage(nextIdsByPage);
          return;
        }
        if (payload?.type === "interaction") {
          showOverlay();
          return;
        }
        if (payload?.type === "ready") {
          setLoadingPdf(false);
          setViewerReady(true);
          onReady?.({ pageCount: pageCountRef.current });
          return;
        }
        if (payload?.type === "verse-zoom") {
          const deltaSteps = Number(payload.deltaSteps || 0);
          adjustVerseFontSize(deltaSteps);
          return;
        }
        if (payload?.type === "verse-layout-state") {
          setBookVerseCanZoomIn(payload.canZoomIn !== false);
          return;
        }
        if (payload?.type === "error") {
          const message = typeof payload.message === "string" && payload.message ? payload.message : "Failed to load reader content.";
          setLoadingError(message);
          setLoadingPdf(false);
          onError?.({ message, code: payload.code });
          return;
        }
        if (payload?.type !== "page-change") return;
        const nextPage = Number(payload.pageNumber);
        if (!Number.isInteger(nextPage) || nextPage <= 0) return;
        if (nextPage === pageNumberRef.current) return;
        pageNumberRef.current = nextPage;
        void setPageNumber(nextPage);
      } catch {
      }
    },
    [adjustVerseFontSize, onError, onReady, setPageNumber, showOverlay]
  );
  const enterVerseFullScreen = react.useCallback(() => {
    if (contentMode !== "verse") return;
    setIsVerseFullScreen(true);
    showOverlay();
  }, [contentMode, showOverlay]);
  const exitVerseFullScreen = react.useCallback(() => {
    if (contentMode !== "verse") return;
    const activeMapping = activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
    if (activeMapping) {
      showMappedVerse(String(activeMapping.verseId), {
        isPlaying: verseAudioStatus.playing,
        animated: false
      });
    }
    setIsVerseFullScreen(false);
    showOverlay();
  }, [
    activeVerseAudioIndex,
    contentMode,
    playableVerseMappings,
    showMappedVerse,
    showOverlay,
    verseAudioStatus.playing
  ]);
  const toggleVerseFullScreen = react.useCallback(() => {
    if (isVerseFullScreen) {
      exitVerseFullScreen();
      return;
    }
    enterVerseFullScreen();
  }, [enterVerseFullScreen, exitVerseFullScreen, isVerseFullScreen]);
  react.useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);
  const requestBookPageChange = react.useCallback(
    (direction) => {
      const methodName = direction === "next" ? "goToNextPage" : "goToPreviousPage";
      const script = `
        (function() {
          if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.${methodName} === 'function') {
            window.__PDF_READER_BRIDGE__.${methodName}();
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
    },
    []
  );
  const goToPreviousPage = react.useCallback(() => {
    const currentPage2 = pageNumberRef.current || pageNumber;
    const currentAnchor = activeBookSpreadMode === "double" && currentPage2 % 2 === 0 ? currentPage2 - 1 : currentPage2;
    const pageStep = viewMode === "book" && activeBookSpreadMode === "double" ? 2 : 1;
    const previousPage = Math.max(1, currentAnchor - pageStep);
    if (viewMode === "book") {
      if (useFullScreenBookWebView) {
        requestBookPageChange("prev");
      } else {
        pageNumberRef.current = previousPage;
        pendingModeSwitchPageRef.current = previousPage;
        void setPageNumber(previousPage);
      }
    } else {
      pageNumberRef.current = previousPage;
      void setPageNumber(previousPage);
    }
    showOverlay();
  }, [
    activeBookSpreadMode,
    pageNumber,
    requestBookPageChange,
    setPageNumber,
    showOverlay,
    useFullScreenBookWebView,
    viewMode
  ]);
  const goToNextPage = react.useCallback(() => {
    const currentPage2 = pageNumberRef.current || pageNumber;
    const currentAnchor = activeBookSpreadMode === "double" && currentPage2 % 2 === 0 ? currentPage2 - 1 : currentPage2;
    const pageStep = viewMode === "book" && activeBookSpreadMode === "double" ? 2 : 1;
    const nextPage = pageCount ? Math.min(currentAnchor + pageStep, pageCount) : currentAnchor + pageStep;
    if (viewMode === "book") {
      if (useFullScreenBookWebView) {
        requestBookPageChange("next");
      } else {
        pageNumberRef.current = nextPage;
        pendingModeSwitchPageRef.current = nextPage;
        void setPageNumber(nextPage);
      }
    } else {
      pageNumberRef.current = nextPage;
      void setPageNumber(nextPage);
    }
    showOverlay();
  }, [
    activeBookSpreadMode,
    pageCount,
    pageNumber,
    requestBookPageChange,
    setPageNumber,
    showOverlay,
    useFullScreenBookWebView,
    viewMode
  ]);
  react.useCallback(() => {
    const firstVerseId = completeVerses[0]?.id || null;
    pendingModeSwitchPageRef.current = 1;
    pageNumberRef.current = 1;
    void setPageNumber(1);
    setReaderVerseId(
      (current) => current === firstVerseId ? current : firstVerseId
    );
    if (viewMode === "continuous") {
      pendingCompleteScrollVerseIdRef.current = firstVerseId;
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      completeScrollRef.current?.scrollTo({ y: 0, animated: true });
      const script = `
        (function() {
          if (!window.__PDF_READER_BRIDGE__) return;
          if (typeof window.__PDF_READER_BRIDGE__.goToPage === 'function') {
            window.__PDF_READER_BRIDGE__.goToPage(1);
            return;
          }
          if (typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
            window.__PDF_READER_BRIDGE__.setViewMode('continuous', 1);
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
    }
    showOverlay();
  }, [completeVerses, setPageNumber, showOverlay, viewMode]);
  const panResponder = react.useMemo(
    () => ReactNative.PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        showOverlay();
        return false;
      },
      onMoveShouldSetPanResponder: (_event, gestureState) => viewMode === "book" && Math.abs(gestureState.dx) > 40 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5,
      onPanResponderRelease: (_event, gestureState) => {
        if (gestureState.dx < -44) {
          goToNextPage();
          return;
        }
        if (gestureState.dx > 44) {
          goToPreviousPage();
        }
      },
      onPanResponderTerminationRequest: () => true
    }),
    [goToNextPage, goToPreviousPage, showOverlay, viewMode]
  );
  const syncViewerStateToWebView = react.useCallback(
    (mode2, requestedPage, anchorVerseId, requestedZoom = zoomLevel) => {
      const safePage = Math.max(1, requestedPage);
      const safeMode = mode2 === "continuous" ? "continuous" : "book";
      const safeVerseId = escapeJsString(anchorVerseId || "");
      const safeZoom = Math.max(
        MIN_ZOOM_LEVEL,
        Math.min(MAX_ZOOM_LEVEL, Number(requestedZoom) || DEFAULT_ZOOM_LEVEL)
      );
      if (safeMode === "continuous" && suppressCompleteModeSyncRef.current) {
        suppressCompleteModeSyncRef.current = false;
        return;
      }
      programmaticViewerSyncRef.current = {
        mode: safeMode,
        page: safePage,
        expiresAt: Date.now() + 500
      };
      const script = `
        (function() {
          if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
            window.__PDF_READER_BRIDGE__.setViewMode('${safeMode}', ${safePage}, '${safeVerseId}', ${safeZoom});
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
    },
    [zoomLevel]
  );
  const switchReaderMode = react.useCallback(
    (mode2) => {
      const currentPage2 = pageNumberRef.current || pageNumber;
      const currentZoom = zoomLevelRef.current || zoomLevel;
      const pageForAnchor = readerVerseId ? versePageById[readerVerseId] : void 0;
      const anchorBelongsToCurrentPage = pageForAnchor === currentPage2;
      const targetPage = pageForAnchor && anchorBelongsToCurrentPage ? pageForAnchor : pageCount ? Math.min(Math.max(1, currentPage2), pageCount) : Math.max(1, currentPage2);
      const targetVerseId = anchorBelongsToCurrentPage ? readerVerseId : verseIdsByPage[targetPage]?.[0] || (useNativeVersePaging ? completeVerses[targetPage - 1]?.id : null) || null;
      if (mode2 === "continuous" && targetVerseId) {
        pendingCompleteScrollVerseIdRef.current = targetVerseId;
      }
      pendingModeSwitchPageRef.current = targetPage;
      pageNumberRef.current = targetPage;
      viewModeRef.current = mode2;
      setReaderVerseId(
        (current) => current === targetVerseId ? current : targetVerseId
      );
      void setPageNumber(targetPage);
      setViewMode(mode2);
      if (contentMode === "verse") {
        setIsVerseFullScreen(
          mode2 === "book" || verseLayout?.fullScreen === true
        );
      }
      setShowShareOverlay(false);
      suppressCompleteModeSyncRef.current = false;
      if (viewerReady && !loadingError) {
        syncViewerStateToWebView(mode2, targetPage, targetVerseId, currentZoom);
        lastSyncedViewModeRef.current = mode2;
      }
      showOverlay();
    },
    [
      loadingError,
      pageCount,
      pageNumber,
      readerVerseId,
      setPageNumber,
      showOverlay,
      syncViewerStateToWebView,
      contentMode,
      completeVerses,
      useNativeVersePaging,
      verseLayout?.fullScreen,
      versePageById,
      verseIdsByPage,
      viewerReady,
      zoomLevel
    ]
  );
  react.useEffect(() => {
    if (!viewerReady || loadingError) return;
    const safePage = pageCount ? Math.min(Math.max(1, pageNumber), pageCount) : Math.max(1, pageNumber);
    const modeChanged = lastSyncedViewModeRef.current !== viewMode;
    const targetPage = pendingModeSwitchPageRef.current ?? safePage;
    const syncPage = modeChanged ? targetPage : safePage;
    const syncSignature = JSON.stringify({
      viewMode,
      pageNumber: syncPage,
      readerVerseId: viewMode === "book" ? "" : readerVerseId || "",
      zoomLevel: Math.round(zoomLevel * 100) / 100
    });
    if (lastInjectedViewerStateRef.current === syncSignature) return;
    syncViewerStateToWebView(
      viewMode,
      syncPage,
      viewMode === "book" ? null : readerVerseId,
      zoomLevel
    );
    lastInjectedViewerStateRef.current = syncSignature;
    pendingModeSwitchPageRef.current = null;
    lastSyncedViewModeRef.current = viewMode;
  }, [
    loadingError,
    pageCount,
    pageNumber,
    readerVerseId,
    syncViewerStateToWebView,
    viewerReady,
    viewMode,
    zoomLevel
  ]);
  react.useEffect(() => {
    if (!viewerReady || loadingError) return;
    const script = `
      (function() {
        if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setZoom === 'function') {
          window.__PDF_READER_BRIDGE__.setZoom(${zoomLevel}, ${pageNumberRef.current});
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
    fullScreenWebViewRef.current?.injectJavaScript(script);
  }, [loadingError, viewerReady, zoomLevel]);
  const handleDownload = async () => {
    if (contentMode !== "pdf" || !resolvedDownloadUrl) {
      return;
    }
    try {
      setDownloadError(null);
      setDownloading(true);
      const downloaded = await expoFileSystem.File.downloadFileAsync(
        resolvedDownloadUrl,
        new expoFileSystem.File(expoFileSystem.Paths.cache, downloadName),
        { idempotent: true }
      );
      if (await Sharing__namespace.isAvailableAsync()) {
        await Sharing__namespace.shareAsync(downloaded.uri, {
          mimeType: "application/pdf",
          dialogTitle: downloadName,
          UTI: "com.adobe.pdf"
        });
        return;
      }
      ReactNative.Alert.alert("Downloaded", downloadName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download PDF";
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };
  const shareMessage = react.useMemo(() => {
    if (shareUrl) {
      return `${label}
${shareUrl}`;
    }
    return label;
  }, [label, shareUrl]);
  const shareLinks = react.useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(label);
    const encodedMessage = encodeURIComponent(shareMessage);
    const xUrl = shareUrl ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` : `https://twitter.com/intent/tweet?text=${encodedText}`;
    const telegramUrl = shareUrl ? `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` : `https://t.me/share/url?text=${encodedText}`;
    return {
      systemUrl: shareUrl ? `https://www.addtoany.com/share#url=${encodedUrl}&title=${encodedText}` : `https://www.addtoany.com/share#title=${encodedText}`,
      whatsappUrl: `whatsapp://send?text=${encodedMessage}`,
      whatsappWebUrl: `https://wa.me/?text=${encodedMessage}`,
      facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      xUrl,
      telegramUrl
    };
  }, [label, shareMessage, shareUrl]);
  const openShareUrl = react.useCallback(async (target) => {
    try {
      await ExpoLinking__namespace.openURL(target);
      setShowShareOverlay(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to open share link";
      ReactNative.Alert.alert("Error", message);
    }
  }, []);
  const openWhatsAppShare = react.useCallback(async () => {
    try {
      await ExpoLinking__namespace.openURL(shareLinks.whatsappUrl);
      setShowShareOverlay(false);
    } catch {
      void openShareUrl(shareLinks.whatsappWebUrl);
    }
  }, [openShareUrl, shareLinks.whatsappUrl, shareLinks.whatsappWebUrl]);
  const openSystemShare = react.useCallback(async () => {
    void openShareUrl(shareLinks.systemUrl);
  }, [openShareUrl, shareLinks.systemUrl]);
  const zoomOutDisabled = contentMode === "verse" ? verseFontSizePx <= verseZoomConfig.min : zoomLevel <= MIN_ZOOM_LEVEL;
  const zoomInDisabled = contentMode === "verse" ? verseFontSizePx >= verseZoomConfig.max || viewMode === "book" && bookVerseCanZoomIn === false : zoomLevel >= MAX_ZOOM_LEVEL;
  const pageBadgeText = contentMode === "verse" && viewMode === "continuous" ? `Page ${pageNumber}${pageCount ? ` / ${pageCount}` : ""}` : `Page ${pageNumber}${pageCount ? ` / ${pageCount}` : ""}`;
  const activeVerseAudio = activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
  const nativeBookPageNumber = pageNumberRef.current || pageNumber;
  const nativeBookVerse = (useNativeBookVerseView || useNativeFullScreenOverlay && viewMode === "book") && completeVerses.length ? completeVerses[Math.max(
    0,
    Math.min(
      completeVerses.length - 1,
      nativeBookPageNumber - 1
    )
  )] : null;
  const nativeSecondBookVerse = nativeBookVerse && activeBookSpreadMode === "double" && completeVerses.length ? completeVerses[Math.max(
    0,
    Math.min(completeVerses.length - 1, nativeBookPageNumber)
  )] || null : null;
  const nativeBookVerses = [nativeBookVerse, nativeSecondBookVerse].filter(
    (verse) => verse !== null
  );
  const verseAudioCurrentSeconds = Math.max(
    0,
    verseAudioStatus.currentTime || 0
  );
  const activeTrackDurationSeconds = react.useMemo(() => {
    if (!activeVerseAudio) return 0;
    const statusTrackDurationSeconds = Math.max(
      0,
      Number(
        verseAudioStatus.duration ?? verseAudioStatus.durationSeconds ?? 0
      )
    );
    const mappedTrackDurationSeconds = playableVerseMappings.filter(
      (mapping) => mapping.audioAssetUrl === activeVerseAudio.audioAssetUrl
    ).reduce(
      (maxEndSeconds, mapping) => Math.max(maxEndSeconds, mapping.segmentEndMs / 1e3),
      0
    );
    return Math.max(statusTrackDurationSeconds, mappedTrackDurationSeconds);
  }, [activeVerseAudio, playableVerseMappings, verseAudioStatus]);
  const verseAudioTimeText = activeVerseAudio ? `${formatTime(Math.max(0, verseAudioCurrentSeconds))} / ${formatTime(Math.max(0, activeTrackDurationSeconds))}` : "";
  const activeVerseAudioDurationSeconds = Math.max(
    0,
    activeTrackDurationSeconds
  );
  const activeVerseAudioElapsedSeconds = activeVerseAudio ? Math.max(
    0,
    Math.min(activeVerseAudioDurationSeconds, verseAudioCurrentSeconds)
  ) : 0;
  const activeVerseAudioProgress = activeVerseAudioDurationSeconds > 0 ? activeVerseAudioElapsedSeconds / activeVerseAudioDurationSeconds : 0;
  const visibleBookVerseIds = react.useMemo(() => {
    const ids = [
      ...verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id ? [completeVerses[pageNumber - 1].id] : [])
    ];
    if (activeBookSpreadMode === "double") {
      ids.push(
        ...verseIdsByPage[pageNumber + 1] || (useNativeVersePaging && completeVerses[pageNumber]?.id ? [completeVerses[pageNumber].id] : [])
      );
    }
    return ids.map((id) => String(id));
  }, [
    activeBookSpreadMode,
    completeVerses,
    pageNumber,
    useNativeVersePaging,
    verseIdsByPage
  ]);
  const visibleMappedVerseAudioIndex = react.useMemo(
    () => playableVerseMappings.findIndex(
      (mapping) => visibleBookVerseIds.includes(String(mapping.verseId))
    ),
    [playableVerseMappings, visibleBookVerseIds]
  );
  const previousMappedVerseAudioIndex = react.useMemo(() => {
    if (!hasVerseAudio || !playableVerseMappings.length) return -1;
    const currentIndex = activeVerseAudioIndex !== null ? activeVerseAudioIndex : visibleMappedVerseAudioIndex;
    if (currentIndex < 0) return -1;
    return currentIndex > 0 ? currentIndex - 1 : -1;
  }, [
    activeVerseAudioIndex,
    hasVerseAudio,
    playableVerseMappings.length,
    visibleMappedVerseAudioIndex
  ]);
  const currentMappedVerseAudioIndex = react.useMemo(() => {
    if (!hasVerseAudio || !playableVerseMappings.length) return -1;
    if (activeVerseAudioIndex !== null) return activeVerseAudioIndex;
    return visibleMappedVerseAudioIndex;
  }, [
    activeVerseAudioIndex,
    hasVerseAudio,
    playableVerseMappings.length,
    visibleMappedVerseAudioIndex
  ]);
  const nextMappedVerseAudioIndex = react.useMemo(() => {
    if (!hasVerseAudio || !playableVerseMappings.length) return -1;
    const currentIndex = activeVerseAudioIndex !== null ? activeVerseAudioIndex : visibleMappedVerseAudioIndex;
    if (currentIndex < 0) return 0;
    return currentIndex + 1 < playableVerseMappings.length ? currentIndex + 1 : -1;
  }, [
    activeVerseAudioIndex,
    hasVerseAudio,
    playableVerseMappings.length,
    visibleMappedVerseAudioIndex
  ]);
  const canPlayPreviousMappedVerse = previousMappedVerseAudioIndex >= 0;
  const canRestartMappedVerse = currentMappedVerseAudioIndex >= 0;
  const canPlayNextMappedVerse = nextMappedVerseAudioIndex >= 0;
  const playPreviousMappedVerse = react.useCallback(() => {
    if (!canPlayPreviousMappedVerse) return;
    activateVerseAudioIndex(previousMappedVerseAudioIndex, { autoplay: true });
  }, [
    activateVerseAudioIndex,
    canPlayPreviousMappedVerse,
    previousMappedVerseAudioIndex
  ]);
  const restartMappedVerse = react.useCallback(() => {
    if (!canRestartMappedVerse) return;
    activateVerseAudioIndex(currentMappedVerseAudioIndex, { autoplay: true });
  }, [
    activateVerseAudioIndex,
    canRestartMappedVerse,
    currentMappedVerseAudioIndex
  ]);
  const playNextMappedVerse = react.useCallback(() => {
    if (!canPlayNextMappedVerse) return;
    activateVerseAudioIndex(nextMappedVerseAudioIndex, { autoplay: true });
  }, [
    activateVerseAudioIndex,
    canPlayNextMappedVerse,
    nextMappedVerseAudioIndex
  ]);
  const seekAudioByLocationX = react.useCallback(
    (locationX) => {
      seekActiveVerseAudioToRatio(
        Math.max(0, locationX || 0) / audioSliderWidth
      );
    },
    [audioSliderWidth, seekActiveVerseAudioToRatio]
  );
  const audioSliderPanResponder = react.useMemo(
    () => ReactNative.PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(activeVerseAudio),
      onMoveShouldSetPanResponder: () => Boolean(activeVerseAudio),
      onPanResponderGrant: (event) => {
        seekAudioByLocationX(event.nativeEvent.locationX || 0);
      },
      onPanResponderMove: (event) => {
        seekAudioByLocationX(event.nativeEvent.locationX || 0);
      }
    }),
    [activeVerseAudio, seekAudioByLocationX]
  );
  const toggleBookSpreadMode = react.useCallback(() => {
    setBookSpreadMode((current) => {
      const next = current === "double" ? "single" : "double";
      const safeNext = allowBookDoubleSpread ? next : "single";
      const currentPage2 = pageNumberRef.current || pageNumber;
      const anchoredPage = safeNext === "double" && currentPage2 % 2 === 0 ? Math.max(1, currentPage2 - 1) : currentPage2;
      pageNumberRef.current = anchoredPage;
      pendingModeSwitchPageRef.current = anchoredPage;
      lastInjectedViewerStateRef.current = null;
      void setPageNumber(anchoredPage);
      setBookVerseCanZoomIn(true);
      return safeNext;
    });
    showOverlay();
  }, [allowBookDoubleSpread, pageNumber, setPageNumber, showOverlay]);
  const nativeFullScreenControls = /* @__PURE__ */ jsxRuntime.jsxs(
    ReactNative.View,
    {
      pointerEvents: "box-none",
      style: [
        styles.nativeFullScreenControls,
        isFullScreenLandscape ? styles.nativeFullScreenControlsLandscape : null
      ],
      children: [
        hasVerseAudio ? /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { pointerEvents: "auto", style: styles.overlayAudioPanel, children: /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.overlayAudioControls, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: playPreviousMappedVerse,
              disabled: !canPlayPreviousMappedVerse,
              style: [
                styles.overlayAudioButton,
                styles.overlayAudioPlayButton,
                !canPlayPreviousMappedVerse ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Play previous mapped verse",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons__default.default,
                {
                  name: "play-skip-back-outline",
                  size: 20,
                  color: "#fff"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: restartMappedVerse,
              disabled: !canRestartMappedVerse,
              style: [
                styles.overlayAudioButton,
                styles.overlayAudioPlayButton,
                !canRestartMappedVerse ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Restart mapped verse",
              children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons__default.default, { name: "refresh-outline", size: 20, color: "#fff" })
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: toggleVerseAudio,
              style: [styles.overlayAudioButton, styles.overlayAudioPlayButton],
              accessibilityLabel: verseAudioStatus.playing ? "Pause audio" : "Play audio",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons__default.default,
                {
                  name: verseAudioStatus.playing ? "pause-outline" : "play-outline",
                  size: 20,
                  color: "#fff"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: playNextMappedVerse,
              disabled: !canPlayNextMappedVerse,
              style: [
                styles.overlayAudioButton,
                styles.overlayAudioPlayButton,
                !canPlayNextMappedVerse ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Play next mapped verse",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons__default.default,
                {
                  name: "play-skip-forward-outline",
                  size: 20,
                  color: "#fff"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onLayout: (event) => {
                const nextWidth = Math.max(
                  1,
                  Math.round(event.nativeEvent.layout.width || 1)
                );
                setAudioSliderWidth(
                  (current) => current === nextWidth ? current : nextWidth
                );
              },
              onPress: (event) => {
                seekAudioByLocationX(event.nativeEvent.locationX || 0);
              },
              disabled: !activeVerseAudio,
              style: [
                styles.overlayAudioSlider,
                !activeVerseAudio ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Seek mapped audio",
              ...audioSliderPanResponder.panHandlers,
              children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { style: styles.overlayAudioSliderTrack, children: /* @__PURE__ */ jsxRuntime.jsx(
                ReactNative.View,
                {
                  style: [
                    styles.overlayAudioSliderFill,
                    {
                      width: `${Math.max(0, Math.min(100, activeVerseAudioProgress * 100))}%`
                    }
                  ]
                }
              ) })
            }
          ),
          verseAudioTimeText ? /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayAudioTime, children: verseAudioTimeText }) : null
        ] }) }) : null,
        /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.overlayZoomGroup, children: [
          viewMode === "book" ? /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: goToPreviousPage,
              disabled: pageNumber <= 1,
              style: [
                styles.overlayZoomButton,
                pageNumber <= 1 ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Previous page",
              children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayButtonText, children: "Prev" })
            }
          ) : null,
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: zoomOutVerse,
              disabled: zoomOutDisabled,
              style: [
                styles.overlayZoomButton,
                zoomOutDisabled ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Zoom out",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons__default.default,
                {
                  name: "remove-outline",
                  size: 20,
                  color: zoomOutDisabled ? "#d4d4d8" : "#fff"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: zoomInVerse,
              disabled: zoomInDisabled,
              style: [
                styles.overlayZoomButton,
                zoomInDisabled ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Zoom in",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons__default.default,
                {
                  name: "add-outline",
                  size: 20,
                  color: zoomInDisabled ? "#d4d4d8" : "#fff"
                }
              )
            }
          ),
          viewMode === "book" && allowBookDoubleSpread ? /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: toggleBookSpreadMode,
              style: styles.overlayZoomButton,
              accessibilityLabel: activeBookSpreadMode === "double" ? "Show one page" : "Show two pages",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons__default.default,
                {
                  name: activeBookSpreadMode === "double" ? "tablet-portrait-outline" : "book-outline",
                  size: 20,
                  color: "#fff"
                }
              )
            }
          ) : null,
          /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: exitVerseFullScreen,
              style: styles.overlayZoomButton,
              accessibilityLabel: "Exit fullscreen reader",
              children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons__default.default, { name: "contract-outline", size: 20, color: "#fff" })
            }
          ),
          viewMode === "book" ? /* @__PURE__ */ jsxRuntime.jsx(
            ReactNative.Pressable,
            {
              onPress: goToNextPage,
              disabled: Boolean(pageCount && pageNumber >= pageCount),
              style: [
                styles.overlayZoomButton,
                pageCount && pageNumber >= pageCount ? styles.overlayButtonDisabled : null
              ],
              accessibilityLabel: "Next page",
              children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayButtonText, children: "Next" })
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { style: styles.overlayPageBadge, children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayPageText, children: pageBadgeText }) })
      ]
    }
  );
  const nativeFullScreenOverlay = useNativeFullScreenOverlay && NativeModal ? /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx(
    NativeModal,
    {
      visible: true,
      transparent: false,
      animationType: ReactNative.Platform.OS === "ios" ? "none" : "slide",
      presentationStyle: "fullScreen",
      statusBarTranslucent: ReactNative.Platform.OS === "android",
      onRequestClose: exitVerseFullScreen,
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        ReactNative.View,
        {
          style: [
            styles.nativeFullScreenRoot,
            { backgroundColor: resolvedReaderTheme.background }
          ],
          children: [
            useFullScreenBookWebView ? /* @__PURE__ */ jsxRuntime.jsx(
              ReactNative.View,
              {
                style: styles.nativeFullScreenBookSurface,
                onTouchStart: showOverlay,
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  reactNativeWebview.WebView,
                  {
                    ref: fullScreenWebViewRef,
                    originWhitelist: ["about:blank"],
                    source: fullScreenWebViewSource,
                    style: styles.nativeFullScreenWebView,
                    javaScriptEnabled: true,
                    domStorageEnabled: true,
                    startInLoadingState: false,
                    setSupportMultipleWindows: false,
                    mixedContentMode: "never",
                    scrollEnabled: true,
                    nestedScrollEnabled: true,
                    bounces: false,
                    showsVerticalScrollIndicator: false,
                    showsHorizontalScrollIndicator: false,
                    scalesPageToFit: false,
                    setBuiltInZoomControls: false,
                    setDisplayZoomControls: false,
                    onLoadStart: () => {
                      setLoadingPdf(true);
                      setViewerReady(false);
                      setLoadingError(null);
                    },
                    onLoadEnd: () => {
                      setLoadingPdf(false);
                      setViewerReady(true);
                    },
                    onMessage: handleFullScreenWebViewMessage
                  },
                  `fullscreen-${viewerReloadKey}-${activeBookSpreadMode}`
                )
              }
            ) : useNativeFullScreenBookView ? /* @__PURE__ */ jsxRuntime.jsx(
              NativeScrollView,
              {
                style: [
                  styles.nativeFullScreenScroll,
                  { backgroundColor: resolvedReaderTheme.background }
                ],
                contentContainerStyle: [
                  styles.nativeFullScreenBookContent,
                  activeBookSpreadMode === "double" ? styles.nativeFullScreenBookContentDouble : null
                ],
                nestedScrollEnabled: true,
                showsVerticalScrollIndicator: false,
                onTouchStart: showOverlay,
                children: nativeBookVerses.map((verse) => /* @__PURE__ */ jsxRuntime.jsx(
                  ReactNative.View,
                  {
                    style: [
                      styles.nativeBookPage,
                      styles.nativeFullScreenBookPage,
                      activeBookSpreadMode === "double" ? styles.nativeFullScreenBookPageDouble : null,
                      {
                        borderColor: resolvedReaderTheme.accent,
                        backgroundColor: resolvedReaderTheme.page,
                        shadowColor: resolvedReaderTheme.shadow
                      }
                    ],
                    children: /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Text,
                      {
                        style: [
                          styles.nativeBookVerseText,
                          COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] || COMPLETE_VERSE_STYLE_MAP.classic,
                          { color: resolvedReaderTheme.text },
                          {
                            fontSize: verseFontSizePx,
                            lineHeight: Math.round(verseFontSizePx * 1.45)
                          }
                        ],
                        children: renderNativeRichText(
                          verse.contentHtml,
                          `fullscreen-book-${verse.id}`
                        )
                      }
                    )
                  },
                  `fullscreen-book-${verse.id}`
                ))
              }
            ) : /* @__PURE__ */ jsxRuntime.jsx(
              NativeScrollView,
              {
                ref: completeScrollRef,
                style: styles.nativeFullScreenScroll,
                contentContainerStyle: [
                  styles.nativeFullScreenScrollContent,
                  isFullScreenLandscape ? styles.nativeFullScreenScrollContentLandscape : null
                ],
                showsVerticalScrollIndicator: false,
                scrollEventThrottle: 64,
                onTouchStart: showOverlay,
                onScrollBeginDrag: handleCompleteScrollBeginDrag,
                onScrollEndDrag: handleCompleteScrollEndDrag,
                onMomentumScrollEnd: handleCompleteMomentumScrollEnd,
                onScroll: (event) => {
                  if (!userDraggingCompleteScrollRef.current) {
                    if (pendingCompleteScrollVerseIdRef.current) return;
                    if (Date.now() < completeRestoreGuardUntilRef.current)
                      return;
                  }
                  updateCompleteAnchorFromOffset(
                    event.nativeEvent.contentOffset.y
                  );
                },
                onContentSizeChange: () => {
                  if (!autoAlignCurrentVerse) return;
                  scrollCompleteToVerse(
                    pendingCompleteScrollVerseIdRef.current || readerVerseId,
                    false
                  );
                },
                onLayout: () => {
                  if (!autoAlignCurrentVerse) return;
                  scrollCompleteToVerse(
                    pendingCompleteScrollVerseIdRef.current || readerVerseId,
                    false
                  );
                },
                children: completeVerses.map((verse) => {
                  const isActive = highlightCurrentVerse && (readerVerseId === verse.id || activeVerseId === verse.id);
                  const textStyle = COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] || COMPLETE_VERSE_STYLE_MAP.classic;
                  return /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.View,
                    {
                      onLayout: (event) => {
                        completeVerseYByIdRef.current[verse.id] = event.nativeEvent.layout.y;
                        if (!autoAlignCurrentVerse) return;
                        if (pendingCompleteScrollVerseIdRef.current === verse.id) {
                          setTimeout(() => {
                            scrollCompleteToVerse(verse.id, false);
                          }, 0);
                        }
                      },
                      style: [
                        styles.nativeFullScreenVerseBlock,
                        {
                          borderColor: isActive ? resolvedReaderTheme.accent : resolvedReaderTheme.border,
                          backgroundColor: isActive ? resolvedReaderTheme.accentSurface : resolvedReaderTheme.page
                        },
                        isActive ? styles.nativeFullScreenVerseBlockActive : null
                      ],
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        ReactNative.Text,
                        {
                          style: [
                            styles.nativeFullScreenVerseText,
                            textStyle,
                            { color: resolvedReaderTheme.text },
                            {
                              fontSize: verseFontSizePx,
                              lineHeight: Math.round(verseFontSizePx * 1.45)
                            }
                          ],
                          children: renderNativeRichText(
                            verse.contentHtml,
                            `fullscreen-complete-${verse.id}`
                          )
                        }
                      )
                    },
                    verse.id
                  );
                })
              }
            ),
            showOverlayControls ? nativeFullScreenControls : null
          ]
        }
      )
    }
  ) }) : null;
  const readerContent = /* @__PURE__ */ jsxRuntime.jsxs(
    ReactNative.View,
    {
      style: [
        styles.container,
        inlineFullScreenActive ? [
          styles.containerFullScreen,
          {
            height: visibleViewportHeight,
            backgroundColor: resolvedReaderTheme.background
          }
        ] : null
      ],
      children: [
        showShareOverlay ? /* @__PURE__ */ jsxRuntime.jsx(
          ReactNative.Pressable,
          {
            style: styles.shareBackdrop,
            onPress: () => setShowShareOverlay(false),
            accessibilityLabel: "Close share options"
          }
        ) : null,
        showHeaderControls ? /* @__PURE__ */ jsxRuntime.jsxs(
          ReactNative.View,
          {
            style: [
              styles.header,
              isVerseFullScreen ? styles.headerFullScreen : null
            ],
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { style: styles.headerActions, children: renderRightActions ? renderRightActions({
                viewMode,
                switchReaderMode,
                showShareOverlay,
                toggleShareOverlay: () => {
                  setShowShareOverlay((v) => !v);
                  showOverlay();
                },
                showOverlay
              }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  ReactNative.Pressable,
                  {
                    onPress: () => {
                      switchReaderMode("continuous");
                    },
                    style: [
                      styles.modeButton,
                      {
                        borderColor: viewMode === "continuous" ? resolvedReaderTheme.accent : resolvedReaderTheme.border,
                        backgroundColor: viewMode === "continuous" ? resolvedReaderTheme.accentSurface : resolvedReaderTheme.buttonSurface
                      }
                    ],
                    accessibilityLabel: "Complete PDF mode",
                    children: /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Text,
                      {
                        style: [
                          styles.modeIcon,
                          {
                            color: viewMode === "continuous" ? resolvedReaderTheme.accent : resolvedReaderTheme.mutedText
                          }
                        ],
                        children: "\u{1F4C4}"
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  ReactNative.Pressable,
                  {
                    onPress: () => {
                      switchReaderMode("book");
                    },
                    style: [
                      styles.modeButton,
                      {
                        borderColor: viewMode === "book" ? resolvedReaderTheme.accent : resolvedReaderTheme.border,
                        backgroundColor: viewMode === "book" ? resolvedReaderTheme.accentSurface : resolvedReaderTheme.buttonSurface
                      }
                    ],
                    accessibilityLabel: "Paginated book mode",
                    children: /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Text,
                      {
                        style: [
                          styles.modeIcon,
                          {
                            color: viewMode === "book" ? resolvedReaderTheme.accent : resolvedReaderTheme.mutedText
                          }
                        ],
                        children: "\u{1F4D6}"
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  ReactNative.Pressable,
                  {
                    onPress: () => {
                      setShowShareOverlay((value) => !value);
                      showOverlay();
                    },
                    style: [
                      styles.modeButton,
                      {
                        borderColor: showShareOverlay ? resolvedReaderTheme.accent : resolvedReaderTheme.border,
                        backgroundColor: showShareOverlay ? resolvedReaderTheme.accentSurface : resolvedReaderTheme.buttonSurface
                      }
                    ],
                    accessibilityLabel: "Share",
                    children: /* @__PURE__ */ jsxRuntime.jsx(
                      Ionicons__default.default,
                      {
                        name: "share-social-outline",
                        size: 15,
                        color: showShareOverlay ? resolvedReaderTheme.accent : resolvedReaderTheme.mutedText
                      }
                    )
                  }
                ),
                contentMode === "pdf" ? /* @__PURE__ */ jsxRuntime.jsx(
                  ReactNative.Pressable,
                  {
                    onPress: () => void handleDownload(),
                    style: [
                      styles.actionButton,
                      {
                        borderColor: resolvedReaderTheme.border,
                        backgroundColor: resolvedReaderTheme.buttonSurface
                      }
                    ],
                    accessibilityLabel: "Download PDF",
                    children: /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Text,
                      {
                        style: [
                          styles.actionIcon,
                          { color: resolvedReaderTheme.accent }
                        ],
                        children: downloading ? "\u2026" : "\u2B07"
                      }
                    )
                  }
                ) : null
              ] }) }),
              showShareOverlay ? /* @__PURE__ */ jsxRuntime.jsx(
                ReactNative.View,
                {
                  style: [
                    styles.shareOverlayCard,
                    {
                      borderColor: resolvedReaderTheme.border,
                      backgroundColor: resolvedReaderTheme.surface,
                      shadowColor: resolvedReaderTheme.shadow
                    }
                  ],
                  children: /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.shareOverlayRow, children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Pressable,
                      {
                        accessibilityLabel: "Share",
                        style: [
                          styles.shareIconButton,
                          {
                            borderColor: resolvedReaderTheme.border,
                            backgroundColor: resolvedReaderTheme.buttonSurface
                          }
                        ],
                        onPress: () => void openSystemShare(),
                        children: /* @__PURE__ */ jsxRuntime.jsx(
                          Ionicons__default.default,
                          {
                            name: "arrow-redo-outline",
                            size: 18,
                            color: resolvedReaderTheme.text
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Pressable,
                      {
                        accessibilityLabel: "Share on WhatsApp",
                        style: [
                          styles.shareIconButton,
                          {
                            borderColor: resolvedReaderTheme.border,
                            backgroundColor: resolvedReaderTheme.buttonSurface
                          }
                        ],
                        onPress: () => void openWhatsAppShare(),
                        children: /* @__PURE__ */ jsxRuntime.jsx(FontAwesome6__default.default, { name: "whatsapp", size: 18, color: "#16a34a" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Pressable,
                      {
                        accessibilityLabel: "Share on Facebook",
                        style: [
                          styles.shareIconButton,
                          {
                            borderColor: resolvedReaderTheme.border,
                            backgroundColor: resolvedReaderTheme.buttonSurface
                          }
                        ],
                        disabled: !shareUrl,
                        onPress: () => void openShareUrl(shareLinks.facebookUrl),
                        children: /* @__PURE__ */ jsxRuntime.jsx(
                          FontAwesome6__default.default,
                          {
                            name: "facebook-f",
                            size: 18,
                            color: !shareUrl ? "#a1a1aa" : "#2563eb"
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Pressable,
                      {
                        accessibilityLabel: "Share on X",
                        style: [
                          styles.shareIconButton,
                          {
                            borderColor: resolvedReaderTheme.border,
                            backgroundColor: resolvedReaderTheme.buttonSurface
                          }
                        ],
                        onPress: () => void openShareUrl(shareLinks.xUrl),
                        children: /* @__PURE__ */ jsxRuntime.jsx(
                          FontAwesome6__default.default,
                          {
                            name: "x-twitter",
                            size: 18,
                            color: resolvedReaderTheme.text
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Pressable,
                      {
                        accessibilityLabel: "Share on Telegram",
                        style: [
                          styles.shareIconButton,
                          {
                            borderColor: resolvedReaderTheme.border,
                            backgroundColor: resolvedReaderTheme.buttonSurface
                          }
                        ],
                        onPress: () => void openShareUrl(shareLinks.telegramUrl),
                        children: /* @__PURE__ */ jsxRuntime.jsx(FontAwesome6__default.default, { name: "telegram", size: 18, color: "#0284c7" })
                      }
                    )
                  ] })
                }
              ) : null
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntime.jsxs(
          ReactNative.View,
          {
            style: [
              styles.viewerWrap,
              { borderColor: resolvedReaderTheme.border },
              useNativeCompleteVerseView || useNativeBookVerseView ? { height: viewerHeight } : inlineFullScreenActive ? styles.viewerWrapFullScreen : { height: viewerHeight }
            ],
            onLayout: contentMode === "verse" ? (event) => {
              const nextHeight = Math.round(
                event.nativeEvent.layout.height || 0
              );
              if (nextHeight > 0 && nextHeight !== viewerWrapHeight) {
                setViewerWrapHeight(nextHeight);
              }
            } : void 0,
            ...viewMode === "book" && contentMode === "verse" ? panResponder.panHandlers : {},
            children: [
              loadingPdf && !useNativeCompleteVerseView && !useNativeBookVerseView ? /* @__PURE__ */ jsxRuntime.jsxs(
                ReactNative.View,
                {
                  style: [
                    styles.loadingWrap,
                    { backgroundColor: resolvedReaderTheme.background }
                  ],
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ReactNative.ActivityIndicator, {}),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.Text,
                      {
                        style: [
                          styles.loadingText,
                          { color: resolvedReaderTheme.mutedText }
                        ],
                        children: loadingMessage
                      }
                    )
                  ]
                }
              ) : null,
              !loadingError ? useNativeBookVerseView ? /* @__PURE__ */ jsxRuntime.jsx(
                NativeScrollView,
                {
                  style: [
                    styles.completeScroll,
                    { backgroundColor: resolvedReaderTheme.background }
                  ],
                  contentContainerStyle: [
                    styles.nativeBookScrollContent,
                    isEmbeddedLandscape ? styles.nativeBookScrollContentCompact : null
                  ],
                  nestedScrollEnabled: true,
                  scrollEventThrottle: 64,
                  showsVerticalScrollIndicator: false,
                  onTouchStart: showOverlay,
                  children: /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.View,
                    {
                      style: [
                        styles.nativeBookPages,
                        activeBookSpreadMode === "double" ? styles.nativeBookPagesDouble : null
                      ],
                      children: nativeBookVerses.map((verse) => /* @__PURE__ */ jsxRuntime.jsx(
                        ReactNative.View,
                        {
                          style: [
                            styles.nativeBookPage,
                            activeBookSpreadMode === "double" ? styles.nativeBookPageDouble : null,
                            {
                              borderColor: resolvedReaderTheme.accent,
                              backgroundColor: resolvedReaderTheme.page,
                              shadowColor: resolvedReaderTheme.shadow
                            }
                          ],
                          children: /* @__PURE__ */ jsxRuntime.jsx(
                            ReactNative.Text,
                            {
                              style: [
                                styles.nativeBookVerseText,
                                COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] || COMPLETE_VERSE_STYLE_MAP.classic,
                                { color: resolvedReaderTheme.text },
                                {
                                  fontSize: verseFontSizePx,
                                  lineHeight: Math.round(verseFontSizePx * 1.45)
                                }
                              ],
                              children: renderNativeRichText(
                                verse.contentHtml,
                                `book-${verse.id}`
                              )
                            }
                          )
                        },
                        `book-${verse.id}`
                      ))
                    }
                  )
                }
              ) : useNativeCompleteVerseView && contentMode === "verse" && viewMode === "continuous" ? /* @__PURE__ */ jsxRuntime.jsx(
                NativeScrollView,
                {
                  ref: completeScrollRef,
                  style: [
                    styles.completeScroll,
                    { backgroundColor: resolvedReaderTheme.background }
                  ],
                  contentContainerStyle: [
                    styles.completeScrollContent,
                    isEmbeddedLandscape ? styles.completeScrollContentCompact : null
                  ],
                  nestedScrollEnabled: true,
                  scrollEventThrottle: 64,
                  showsVerticalScrollIndicator: false,
                  onTouchStart: showOverlay,
                  onScrollBeginDrag: handleCompleteScrollBeginDrag,
                  onScrollEndDrag: handleCompleteScrollEndDrag,
                  onMomentumScrollEnd: handleCompleteMomentumScrollEnd,
                  onScroll: (event) => {
                    if (!userDraggingCompleteScrollRef.current) {
                      if (pendingCompleteScrollVerseIdRef.current) return;
                      if (Date.now() < completeRestoreGuardUntilRef.current) return;
                    }
                    updateCompleteAnchorFromOffset(
                      event.nativeEvent.contentOffset.y
                    );
                  },
                  onContentSizeChange: () => {
                    if (!autoAlignCurrentVerse) return;
                    scrollCompleteToVerse(
                      pendingCompleteScrollVerseIdRef.current || readerVerseId,
                      false
                    );
                  },
                  onLayout: () => {
                    if (!autoAlignCurrentVerse) return;
                    scrollCompleteToVerse(
                      pendingCompleteScrollVerseIdRef.current || readerVerseId,
                      false
                    );
                  },
                  children: completeVerses.map((verse) => {
                    const isActive = highlightCurrentVerse && (readerVerseId === verse.id || activeVerseId === verse.id);
                    const textStyle = COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] || COMPLETE_VERSE_STYLE_MAP.classic;
                    return /* @__PURE__ */ jsxRuntime.jsx(
                      ReactNative.View,
                      {
                        onLayout: (event) => {
                          completeVerseYByIdRef.current[verse.id] = event.nativeEvent.layout.y;
                          if (!autoAlignCurrentVerse) return;
                          if (pendingCompleteScrollVerseIdRef.current === verse.id) {
                            setTimeout(() => {
                              scrollCompleteToVerse(verse.id, false);
                            }, 0);
                          }
                        },
                        style: [
                          styles.completeVerseBlock,
                          {
                            borderColor: isActive ? resolvedReaderTheme.accent : resolvedReaderTheme.border,
                            backgroundColor: isActive ? resolvedReaderTheme.accentSurface : resolvedReaderTheme.page,
                            shadowColor: resolvedReaderTheme.shadow
                          },
                          isActive ? styles.completeVerseBlockActive : null
                        ],
                        children: /* @__PURE__ */ jsxRuntime.jsx(
                          ReactNative.Text,
                          {
                            style: [
                              styles.completeVerseText,
                              textStyle,
                              { color: resolvedReaderTheme.text },
                              {
                                fontSize: verseFontSizePx,
                                lineHeight: Math.round(verseFontSizePx * 1.45)
                              }
                            ],
                            children: renderNativeRichText(
                              verse.contentHtml,
                              `complete-${verse.id}`
                            )
                          }
                        )
                      },
                      verse.id
                    );
                  })
                }
              ) : /* @__PURE__ */ jsxRuntime.jsx(
                reactNativeWebview.WebView,
                {
                  ref: webViewRef,
                  originWhitelist: ["about:blank"],
                  source: webViewSource,
                  style: [
                    styles.webview,
                    { flex: 1 },
                    inlineFullScreenActive ? styles.webviewFullScreen : null
                  ],
                  javaScriptEnabled: true,
                  domStorageEnabled: true,
                  startInLoadingState: false,
                  onLoadStart: () => {
                    setLoadingPdf(true);
                    setViewerReady(false);
                    setLoadingError(null);
                  },
                  onLoadEnd: () => {
                    if (contentMode === "verse") {
                      setLoadingPdf(false);
                      setViewerReady(true);
                    }
                  },
                  setSupportMultipleWindows: false,
                  mixedContentMode: "never",
                  allowFileAccess: usesLocalFileFallback,
                  allowFileAccessFromFileURLs: usesLocalFileFallback,
                  allowUniversalAccessFromFileURLs: usesLocalFileFallback,
                  scrollEnabled: contentMode === "pdf" || isVerseFullScreen,
                  nestedScrollEnabled: viewMode === "book" || viewMode === "continuous",
                  bounces: false,
                  showsVerticalScrollIndicator: false,
                  showsHorizontalScrollIndicator: false,
                  scalesPageToFit: false,
                  setBuiltInZoomControls: true,
                  setDisplayZoomControls: false,
                  pointerEvents: "auto",
                  onTouchStart: showOverlay,
                  onRenderProcessGone: () => {
                    const message = "The PDF viewer stopped unexpectedly. Please use Download PDF.";
                    setLoadingError(message);
                    setLoadingPdf(false);
                    setViewerReady(false);
                    onError?.({ message, code: "render-process-gone" });
                  },
                  onMessage: (event) => {
                    try {
                      const payload = JSON.parse(event.nativeEvent.data || "{}");
                      if (payload?.type === "document-meta") {
                        const nextPageCount = Number(payload.pageCount);
                        if (Number.isInteger(nextPageCount) && nextPageCount > 0) {
                          if (pageCountRef.current === nextPageCount) return;
                          pageCountRef.current = nextPageCount;
                          setPageCount(nextPageCount);
                        }
                        return;
                      }
                      if (payload?.type === "verse-pages") {
                        const nextPageById = {};
                        const nextIdsByPage = {};
                        const pages = Array.isArray(payload.pages) ? payload.pages : [];
                        const nextSignature = JSON.stringify(pages);
                        if (versePagesSignatureRef.current === nextSignature)
                          return;
                        versePagesSignatureRef.current = nextSignature;
                        for (const page of pages) {
                          const pageNumberValue = Number(page?.pageNumber);
                          if (!Number.isInteger(pageNumberValue) || pageNumberValue <= 0)
                            continue;
                          const verseIds = Array.isArray(page?.verseIds) ? page.verseIds : [];
                          nextIdsByPage[pageNumberValue] = verseIds.map(
                            (verseId) => String(verseId)
                          );
                          for (const verseId of verseIds) {
                            nextPageById[String(verseId)] = pageNumberValue;
                          }
                        }
                        setVersePageById(nextPageById);
                        setVerseIdsByPage(nextIdsByPage);
                        return;
                      }
                      if (payload?.type === "interaction") {
                        showOverlay();
                        return;
                      }
                      if (payload?.type === "ready") {
                        setLoadingPdf(false);
                        setViewerReady(true);
                        onReady?.({ pageCount: pageCountRef.current });
                        return;
                      }
                      if (payload?.type === "verse-zoom") {
                        if (contentMode !== "verse") return;
                        const deltaSteps = Number(payload.deltaSteps || 0);
                        adjustVerseFontSize(deltaSteps);
                        return;
                      }
                      if (payload?.type === "content-height") {
                        return;
                      }
                      if (payload?.type === "book-page-size") {
                        if (contentMode !== "pdf") return;
                        const nextHeight = Math.min(
                          maxPdfBookViewerHeight,
                          Math.max(320, Math.ceil(Number(payload.height) || 0))
                        );
                        setPdfBookViewerHeight(
                          (current) => current === nextHeight ? current : nextHeight
                        );
                        return;
                      }
                      if (payload?.type === "error") {
                        const message = typeof payload.message === "string" && payload.message ? payload.message : "Failed to load PDF.";
                        const errorCode = typeof payload.code === "string" ? payload.code : "";
                        if (contentMode === "pdf" && enableLocalFallback && errorCode === "fetch-failed" && !triedLocalFileFallback) {
                          setTriedLocalFileFallback(true);
                          setLoadingPdf(true);
                          setLoadingError(null);
                          void (async () => {
                            try {
                              const downloaded = await expoFileSystem.File.downloadFileAsync(
                                resolvedDownloadUrl,
                                new expoFileSystem.File(expoFileSystem.Paths.cache, downloadName),
                                { idempotent: true }
                              );
                              if (!downloaded.uri) {
                                setLoadingError(
                                  `Downloaded fallback file does not exist at: ${downloaded.uri}`
                                );
                                setLoadingPdf(false);
                                return;
                              }
                              if (ReactNative.Platform.OS === "android") {
                                await stopStaticServer();
                                if (!hasNativeStaticServer()) {
                                  setLoadingError(
                                    "In-app local PDF fallback requires a development build. Please use Download PDF in Expo Go."
                                  );
                                  setLoadingPdf(false);
                                  return;
                                }
                                const filePath = downloaded.uri.replace(
                                  "file://",
                                  ""
                                );
                                const dirPath = filePath.substring(
                                  0,
                                  filePath.lastIndexOf("/")
                                );
                                const fileBase = filePath.substring(
                                  filePath.lastIndexOf("/") + 1
                                );
                                let ServerClass = null;
                                try {
                                  const mod = await import('react-native-static-server');
                                  ServerClass = mod?.default || null;
                                } catch {
                                  ServerClass = null;
                                }
                                if (!ServerClass) {
                                  setLoadingError(
                                    "In-app local PDF fallback is unavailable in this build. Please use Download PDF."
                                  );
                                  setLoadingPdf(false);
                                  return;
                                }
                                const server = new ServerClass(0, dirPath, {
                                  localOnly: true
                                });
                                if (!server || typeof server.start !== "function") {
                                  setLocalPdfUrl(downloaded.uri);
                                } else {
                                  const serverUrl = await server.start();
                                  if (!serverUrl) {
                                    setLocalPdfUrl(downloaded.uri);
                                  } else {
                                    staticServerRef.current = server;
                                    setLocalPdfUrl(
                                      `${serverUrl}/${encodeURIComponent(fileBase)}`
                                    );
                                  }
                                }
                              } else {
                                setLocalPdfUrl(downloaded.uri);
                              }
                              setViewerReloadKey((value) => value + 1);
                            } catch (fallbackError) {
                              const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Unable to load this PDF in-app.";
                              setLoadingError(`Fallback error: ${fallbackMessage}`);
                              setLoadingPdf(false);
                            }
                          })();
                          return;
                        }
                        setLoadingError(
                          errorCode === "fetch-failed" ? `Unable to load this PDF in-app. Tried: ${effectivePdfUrl}` : message
                        );
                        onError?.({ message, code: errorCode || void 0 });
                        setLoadingPdf(false);
                        return;
                      }
                      if (payload?.type !== "page-change") return;
                      if (viewMode === "continuous" && payload?.isAutoScroll !== true)
                        return;
                      const nextPage = Number(payload.pageNumber);
                      if (!Number.isInteger(nextPage) || nextPage <= 0) return;
                      const pendingSync = programmaticViewerSyncRef.current;
                      if (pendingSync) {
                        if (Date.now() > pendingSync.expiresAt) {
                          programmaticViewerSyncRef.current = null;
                        } else if (pendingSync.mode !== viewMode || pendingSync.page !== nextPage) {
                          return;
                        } else {
                          programmaticViewerSyncRef.current = null;
                        }
                      }
                      if (nextPage === pageNumber || !isPageHydrated) return;
                      if (viewMode === "continuous") {
                        suppressCompleteModeSyncRef.current = true;
                      }
                      pageNumberRef.current = nextPage;
                      void setPageNumber(nextPage);
                      if (viewMode === "continuous") {
                        showOverlay();
                      }
                    } catch {
                    }
                  }
                },
                `${viewerReloadKey}`
              ) : /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.loadingWrap, children: [
                /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.errorText, children: loadingError }),
                /* @__PURE__ */ jsxRuntime.jsx(
                  ReactNative.Pressable,
                  {
                    onPress: () => {
                      setLoadingError(null);
                      setLoadingPdf(true);
                      setViewerReady(false);
                      setLocalPdfUrl(null);
                      setTriedLocalFileFallback(false);
                      setViewerReloadKey((value) => value + 1);
                    },
                    style: styles.secondaryButton,
                    children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.secondaryButtonText, children: "Retry" })
                  }
                )
              ] }),
              !loadingError && showOverlayControls ? /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { pointerEvents: "box-none", style: styles.viewerOverlay, children: /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.overlayBottomCenter, children: [
                hasVerseAudio ? /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { pointerEvents: "auto", style: styles.overlayAudioPanel, children: /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.overlayAudioControls, children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: playPreviousMappedVerse,
                      disabled: !canPlayPreviousMappedVerse,
                      style: [
                        styles.overlayAudioButton,
                        styles.overlayAudioPlayButton,
                        !canPlayPreviousMappedVerse ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Play previous mapped verse",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        Ionicons__default.default,
                        {
                          name: "play-skip-back-outline",
                          size: 20,
                          color: "#fff"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: restartMappedVerse,
                      disabled: !canRestartMappedVerse,
                      style: [
                        styles.overlayAudioButton,
                        styles.overlayAudioPlayButton,
                        !canRestartMappedVerse ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Restart mapped verse",
                      children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons__default.default, { name: "refresh-outline", size: 20, color: "#fff" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: toggleVerseAudio,
                      style: [
                        styles.overlayAudioButton,
                        styles.overlayAudioPlayButton
                      ],
                      accessibilityLabel: verseAudioStatus.playing ? "Pause audio" : "Play audio",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        Ionicons__default.default,
                        {
                          name: verseAudioStatus.playing ? "pause-outline" : "play-outline",
                          size: 20,
                          color: "#fff"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: playNextMappedVerse,
                      disabled: !canPlayNextMappedVerse,
                      style: [
                        styles.overlayAudioButton,
                        styles.overlayAudioPlayButton,
                        !canPlayNextMappedVerse ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Play next mapped verse",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        Ionicons__default.default,
                        {
                          name: "play-skip-forward-outline",
                          size: 20,
                          color: "#fff"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onLayout: (event) => {
                        const nextWidth = Math.max(
                          1,
                          Math.round(event.nativeEvent.layout.width || 1)
                        );
                        setAudioSliderWidth(
                          (current) => current === nextWidth ? current : nextWidth
                        );
                      },
                      onPress: (event) => {
                        seekAudioByLocationX(
                          event.nativeEvent.locationX || 0
                        );
                      },
                      disabled: !activeVerseAudio,
                      style: [
                        styles.overlayAudioSlider,
                        !activeVerseAudio ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Seek mapped audio",
                      ...audioSliderPanResponder.panHandlers,
                      children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { style: styles.overlayAudioSliderTrack, children: /* @__PURE__ */ jsxRuntime.jsx(
                        ReactNative.View,
                        {
                          style: [
                            styles.overlayAudioSliderFill,
                            {
                              width: `${Math.max(0, Math.min(100, activeVerseAudioProgress * 100))}%`
                            }
                          ]
                        }
                      ) })
                    }
                  ),
                  verseAudioTimeText ? /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayAudioTime, children: verseAudioTimeText }) : null
                ] }) }) : null,
                /* @__PURE__ */ jsxRuntime.jsxs(ReactNative.View, { style: styles.overlayZoomGroup, children: [
                  viewMode === "book" ? /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: goToPreviousPage,
                      disabled: pageNumber <= 1,
                      style: [
                        styles.overlayZoomButton,
                        pageNumber <= 1 ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Previous page",
                      children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayButtonText, children: "Prev" })
                    }
                  ) : null,
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: () => contentMode === "verse" ? zoomOutVerse() : adjustPdfZoom(-PDF_ZOOM_STEP),
                      disabled: zoomOutDisabled,
                      style: [
                        styles.overlayZoomButton,
                        zoomOutDisabled ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Zoom out",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        Ionicons__default.default,
                        {
                          name: "remove-outline",
                          size: 20,
                          color: zoomOutDisabled ? "#d4d4d8" : "#fff"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: () => contentMode === "verse" ? zoomInVerse() : adjustPdfZoom(PDF_ZOOM_STEP),
                      disabled: zoomInDisabled,
                      style: [
                        styles.overlayZoomButton,
                        zoomInDisabled ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Zoom in",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        Ionicons__default.default,
                        {
                          name: "add-outline",
                          size: 20,
                          color: zoomInDisabled ? "#d4d4d8" : "#fff"
                        }
                      )
                    }
                  ),
                  contentMode === "verse" ? /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: toggleVerseFullScreen,
                      style: styles.overlayZoomButton,
                      accessibilityLabel: isVerseFullScreen ? "Exit fullscreen reader" : "Enter fullscreen reader",
                      children: /* @__PURE__ */ jsxRuntime.jsx(
                        Ionicons__default.default,
                        {
                          name: isVerseFullScreen ? "contract-outline" : "expand-outline",
                          size: 20,
                          color: "#fff"
                        }
                      )
                    }
                  ) : null,
                  viewMode === "book" ? /* @__PURE__ */ jsxRuntime.jsx(
                    ReactNative.Pressable,
                    {
                      onPress: goToNextPage,
                      disabled: Boolean(pageCount && pageNumber >= pageCount),
                      style: [
                        styles.overlayZoomButton,
                        pageCount && pageNumber >= pageCount ? styles.overlayButtonDisabled : null
                      ],
                      accessibilityLabel: "Next page",
                      children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayButtonText, children: "Next" })
                    }
                  ) : null
                ] }),
                /* @__PURE__ */ jsxRuntime.jsx(ReactNative.View, { style: styles.overlayPageBadge, children: /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.overlayPageText, children: pageBadgeText }) })
              ] }) }) : null
            ]
          }
        ),
        downloadError ? /* @__PURE__ */ jsxRuntime.jsx(ReactNative.Text, { style: styles.errorText, children: downloadError }) : null
      ]
    }
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    suppressInlineReaderSurface ? null : readerContent,
    nativeFullScreenOverlay
  ] });
}
var styles = ReactNative.StyleSheet.create({
  container: {
    gap: 0,
    position: "relative",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  containerFullScreen: {
    flex: 1,
    gap: 8,
    backgroundColor: "#f5f5f4",
    padding: 8,
    justifyContent: "flex-start",
    alignItems: "stretch"
  },
  nativeFullScreenRoot: {
    flex: 1,
    backgroundColor: "#f5f5f4",
    overflow: "hidden",
    position: "relative"
  },
  nativeFullScreenWebView: {
    flex: 1,
    backgroundColor: "transparent"
  },
  nativeFullScreenBookSurface: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0
  },
  nativeFullScreenScroll: {
    flex: 1,
    backgroundColor: "transparent"
  },
  nativeFullScreenScrollContent: {
    paddingHorizontal: 6,
    paddingTop: ReactNative.Platform.OS === "ios" ? 48 : 10,
    paddingBottom: 112,
    gap: 10
  },
  nativeFullScreenScrollContentLandscape: {
    paddingTop: 8,
    paddingBottom: 88
  },
  nativeFullScreenPage: {
    borderRadius: 12,
    backgroundColor: "#fffbea",
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: "100%",
    borderWidth: 3,
    borderColor: "#f97316",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: "hidden"
  },
  nativeFullScreenVerseBlock: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    paddingRight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fffbea"
  },
  nativeFullScreenVerseBlockActive: {
    borderColor: "#f97316"
  },
  nativeFullScreenVerseGroup: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.03,
    marginBottom: 4
  },
  nativeFullScreenVerseLabel: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4
  },
  nativeFullScreenVerseText: {
    color: "#111827",
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
    width: "100%"
  },
  nativeFullScreenControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    gap: 8,
    zIndex: 30,
    elevation: 30
  },
  nativeFullScreenControlsLandscape: {
    bottom: 6,
    gap: 4
  },
  header: {
    gap: 0,
    position: "relative",
    zIndex: 40
  },
  headerFullScreen: {
    zIndex: 50
  },
  shareBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    flexWrap: "nowrap"
  },
  actionButton: {
    width: 34,
    height: 30,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  actionIcon: {
    color: "#c2410c",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  secondaryButtonText: {
    color: "#3f3f46",
    fontSize: 12,
    fontWeight: "600"
  },
  modeButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    width: 34,
    height: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  modeButtonActive: {
    borderColor: "#c2410c",
    backgroundColor: "#fff7ed"
  },
  modeIcon: {
    color: "#52525b",
    fontSize: 14,
    fontWeight: "800"
  },
  modeIconActive: {
    color: "#c2410c"
  },
  shareOverlayCard: {
    position: "absolute",
    top: 36,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafaf9",
    padding: 10,
    gap: 10,
    shadowColor: "#111827",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 50
  },
  shareOverlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  shareIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  viewerWrap: {
    overflow: "visible",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "transparent",
    minHeight: 0,
    position: "relative",
    width: "100%"
  },
  viewerWrapVerse: {
    flex: 1,
    minHeight: 0
  },
  viewerWrapFullScreen: {
    minHeight: 0,
    flex: 1
  },
  webview: {
    width: "100%",
    minHeight: 320,
    backgroundColor: "transparent"
  },
  webviewFullScreen: {
    flex: 1,
    height: void 0
  },
  completeScroll: {
    width: "100%",
    backgroundColor: "#fafaf9"
  },
  completeScrollContent: {
    padding: 10,
    paddingBottom: 104,
    gap: 10
  },
  completeScrollContentCompact: {
    paddingBottom: 82
  },
  nativeBookScrollContent: {
    padding: 10,
    paddingBottom: 104
  },
  nativeBookScrollContentCompact: {
    paddingBottom: 82
  },
  nativeBookPages: {
    width: "100%",
    flexDirection: "column",
    gap: 10
  },
  nativeBookPagesDouble: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  completeVerseBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    paddingRight: 52,
    gap: 8,
    position: "relative"
  },
  completeVerseBlockActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
    shadowColor: "#c2410c",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  completeVerseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  completeVerseGroup: {
    color: "#78716c",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase"
  },
  completeVerseLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  completeVerseText: {
    color: "#111827",
    textAlign: "center",
    flexShrink: 1,
    width: "100%"
  },
  nativeBookPage: {
    width: "100%",
    borderWidth: 3,
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 18,
    paddingBottom: 92,
    overflow: "hidden",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  nativeBookPageDouble: {
    flex: 1,
    width: void 0
  },
  nativeFullScreenBookContent: {
    minHeight: "100%",
    padding: 10,
    paddingBottom: 104
  },
  nativeFullScreenBookContentDouble: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch"
  },
  nativeFullScreenBookPage: {
    minHeight: "100%"
  },
  nativeFullScreenBookPageDouble: {
    flex: 1,
    width: void 0
  },
  nativeBookVerseText: {
    color: "#111827",
    textAlign: "center",
    flexShrink: 1,
    width: "100%"
  },
  loadingWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    backgroundColor: "#f5f5f4"
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13
  },
  viewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: "space-between"
  },
  overlayButtonDisabled: {
    opacity: 0.45
  },
  overlayButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800"
  },
  overlayBottomCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: "center",
    gap: 6
  },
  overlayAudioPanel: {
    width: "82%",
    maxWidth: 360,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "rgba(24, 24, 27, 0.78)"
  },
  overlayAudioTime: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 74,
    textAlign: "right"
  },
  overlayAudioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  overlayAudioButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)"
  },
  overlayAudioPlayButton: {
    width: 40,
    height: 40,
    backgroundColor: "#0f766e"
  },
  overlayAudioSlider: {
    flex: 1,
    height: 34,
    justifyContent: "center"
  },
  overlayAudioSliderTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.22)"
  },
  overlayAudioSliderFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#5eead4"
  },
  overlayZoomGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  overlayZoomButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    backgroundColor: "rgba(24, 24, 27, 0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  overlayTextButton: {
    borderRadius: 18,
    minWidth: 112,
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: "rgba(24, 24, 27, 0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  overlayPageBadge: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)"
  },
  overlayPageText: {
    color: "#27272a",
    fontSize: 12,
    fontWeight: "800"
  }
});

exports.PdfDocumentViewer = PdfDocumentViewer;
//# sourceMappingURL=react-native.cjs.map
//# sourceMappingURL=react-native.cjs.map