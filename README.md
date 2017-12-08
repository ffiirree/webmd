# Webmd

`Webmd`是一个在线的`Markdown`编辑器，可以很方便的集成到需要进行编辑的页面中。

## Features
- gfm
- Todo list
- flow chart
- Mathjax

## Quick Start
页面需要包含
```html
    <!--依赖-->
    <link rel="stylesheet" href="libs/highlight/styles/default.css">
    <link rel="stylesheet" href="libs/codemirror/lib/codemirror.css">
    <link rel="stylesheet" href="libs/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Tangerine|Lato|Consolas">

    <script type="text/javascript" src="libs/jquery-3.2.1.min.js"></script>
    <script type="text/javascript" src="libs/raphael.min.js"></script>
    <script type="text/javascript" src="libs/flowchart.min.js"></script>
    <script type="text/javascript" src="libs/marked.min.js"></script>
    <script type="text/javascript" src="libs/codemirror/lib/codemirror.js"></script>
    <script type="text/javascript" src="libs/codemirror/mode/markdown/markdown.js"></script>
    <script type="text/javascript" src="libs/codemirror/mode/gfm/gfm.js"></script>
    <script type="text/javascript" src="libs/highlight/highlight.pack.js"></script>
    <script>hljs.initHighlightingOnLoad();</script>

    <!--MathJax-->
    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
            extensions: ["tex2jax.js"],
            jax: ["input/TeX", "output/HTML-CSS"],
            tex2jax: {
                inlineMath: [ ['$','$'], ["\\(","\\)"] ],
                displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
                processEscapes: true
            },
            "HTML-CSS": { availableFonts: ["TeX"] }
        });
    </script>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script>

    <script type="text/javascript" src="webmd.js"></script>
    <link rel="stylesheet" href="style/webmd.css">
```
```html
<section id="webmd"></section>
```

Javascript
```javascript
new Editor({
    selector: '#webmd',
    mode: 'normal-mode', // 'edit-mode' 'preview-mode'
    menu: true
});
```

## UI
![](https://github.com/ffiirree/webmd/blob/master/webmd.png)