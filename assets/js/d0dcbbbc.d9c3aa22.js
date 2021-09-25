"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[612],{4709:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return l},contentTitle:function(){return o},metadata:function(){return u},assets:function(){return p},toc:function(){return m},default:function(){return d}});var r=t(7462),a=t(3366),i=(t(7294),t(3905)),s=["components"],l={slug:"frerunner-0-0-1",title:"Freerunner 0.0.1",authors:["sebring"],tags:["docusaurus"]},o="Freerunner - a modern Crafty",u={permalink:"/freerunner/blog/frerunner-0-0-1",editUrl:"https://github.com/sebring/freerunner/edit/blog/2021-09-15-freerunner-first-commit.md",source:"@site/blog/2021-09-15-freerunner-first-commit.md",title:"Freerunner 0.0.1",description:"I've just published Freerunner 0.0.1 on npm!",date:"2021-09-15T00:00:00.000Z",formattedDate:"September 15, 2021",tags:[{label:"docusaurus",permalink:"/freerunner/blog/tags/docusaurus"}],readingTime:1.48,truncated:!1,authors:[{name:"Johan Sebring",title:"Developer",url:"https://github.com/sebring",imageURL:"https://github.com/sebring.png",key:"sebring"}]},p={authorsImageUrls:[void 0]},m=[{value:"Nearest milestones:",id:"nearest-milestones",children:[{value:"0.0.1 - the package",id:"001---the-package",children:[]},{value:"0.0.2 - the imports",id:"002---the-imports",children:[]},{value:"0.0.3 -- the plugins",id:"003----the-plugins",children:[]}]}],g={toc:m};function d(e){var n=e.components,t=(0,a.Z)(e,s);return(0,i.kt)("wrapper",(0,r.Z)({},g,t,{components:n,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"I've just published Freerunner 0.0.1 on npm!"),(0,i.kt)("p",null,"It is just a raw wrapper around ",(0,i.kt)("a",{parentName:"p",href:"http://craftyjs.com"},"crafty")," with all its glory and also all its legacy code. Little by little I will carve and shape it to my imagination of a really simple yet powerful game engine. Will the API always be compatible with Crafty? I don't know, but as long as i makes sense, it makes sense."),(0,i.kt)("h2",{id:"nearest-milestones"},"Nearest milestones:"),(0,i.kt)("h3",{id:"001---the-package"},"0.0.1 - the package"),(0,i.kt)("p",null,"A working npm-package with crafty wrapped with limited typescript support. Using an full featured game engine means a the api is big and the intellisense enabled by typescript is such a timesaver. Writing interfaces and definitions will be ongoing and I do not strive to make it complete yet but will add more support for each release."),(0,i.kt)("h3",{id:"002---the-imports"},"0.0.2 - the imports"),(0,i.kt)("p",null,"Having components as separate es modules. This will keep game code manageble as the game evolves and features are added. However it will also make reusing components even easier."),(0,i.kt)("p",null,"From:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"Crafty.c('MyComponent', {\n    init: function() { /.../ },\n    events: /../\n})\n")),(0,i.kt)("p",null,"To:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"import MyComponent from '/components/MyComponents'\n\nFreerunner.cc(MyComponent)\n")),(0,i.kt)("h3",{id:"003----the-plugins"},"0.0.3 -- the plugins"),(0,i.kt)("p",null,"Using a plugin should be as easy as importing it and loading it into Freerunner. A plugin should be able to add"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"components"),(0,i.kt)("li",{parentName:"ul"},"systems"),(0,i.kt)("li",{parentName:"ul"},"static resources as sprites and sounds")),(0,i.kt)("p",null,"Example"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"\n// imaginary plugin with level generator, sprits and mini-map\nimport DungeonPlugin from 'freerunner-dungeon'\n// imaginary plugin that adds inventory support\nimport InventoryPlugin from 'freerunner-medivalitems'\n\nFreerunner.addPlugin(DungeonPlugin)\nFreerunner.addPlugin(InventoryPlugin)\n\nconst level1 = DungeonPlugin.generateLevel() // custom functions\n")),(0,i.kt)("p",null,"Plugins should have a defined way of testing and showcasing them, like a minimal demo."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-javascript"},"import DungeonPlugin from 'freerunner-dungeon'\n\nDungeonPlugin.runDemo(Freerunner)\n")),(0,i.kt)("p",null,"or why not from console having Freerunner as a dev-dependency "),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"yarn demo\n")))}d.isMDXComponent=!0}}]);