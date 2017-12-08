
class Editor {
    constructor(options) {
        $(options.selector).addClass('Webmd');
        $(UI).appendTo(options.selector);
        this.$$textarea = $('#webmd-textarea');
        this.$$preview = $('#webmd-preview');
        this.$$leftscroll = $('#edit-page');
        this.$$rightscroll = $('#preview-page');
        this.$$leftarea = $('#edit-area');
        this.$$rightarea = $('#preview-area');

        options.mode ?  this.setMode(options.mode) : this.setMode('normal-mode');
        options.menu ? $('.webmd-menu').show() : $('.webmd-menu').hide();


        this.mouse = { x: 0, y: 0 };
        this.updateEventId = 0;

        // CodeMirror configuration
        this.codemirror = CodeMirror.fromTextArea(this.$$textarea[0], {
            lineNumbers: false,
            viewportMargin: Infinity,
            mode: 'markdown',
            theme: "webmd",
            lineWrapping: true,
            styleActiveLine: true,
            showCursorWhenSelecting: true,
            extraKeys: { "Enter": "newlineAndIndentContinueMarkdownList" }
        });
        this.codemirror.focus();
        this.$$leftarea.click(()=>this.codemirror.focus());

        // Markdown render
        this.mark = marked;
        // For to do list.
        let renderer = new marked.Renderer();
        renderer.listitem = function(text) {
            if (/^\s*\[[x ]\]\s*/.test(text)) {
                text = text
                    .replace(/^\s*\[ \]\s*/, '<i class="fa fa-circle-o"></i> ')
                    .replace(/^\s*\[x\]\s*/, '<i class="fa fa-check-circle"></i> ');
                return '<li style="list-style: none">' + text + '</li>';
            } else {
                return '<li>' + text + '</li>';
            }
        };
        this.mark.setOptions({
            renderer: renderer,
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: false
        });


        // menu
        this._menu = new Menu({ editor: this, upload: !!options.upload });

        // preview
        this.codemirror.on('change', ()=>{
            this.__preview__(this.codemirror.getValue());
        });

        this.__preview__(this.codemirror.getValue());

        // sync_scrolling();
        this.$$leftarea.find('.blank').height(this.$$leftscroll.height()/2);
        this.$$rightarea.find('.blank').height(this.$$rightscroll.height()/2);
        $(window).resize(()=>{
            this.$$leftarea.find('.blank').height(this.$$leftscroll.height()/2);
            this.$$rightarea.find('.blank').height(this.$$rightscroll.height()/2);
        });
        this.__sync_scrolling__();
    }

    setMode(mode) {

        switch(mode) {
            case 'normal-mode':
                this.$$leftscroll.show().css({ flex: '0 0 50%' });
                this.$$leftarea.css({ width: '100%' });

                this.$$rightscroll.show().css({ flex: '0 0 50%' });
                this.$$rightarea.css({ width: '100%' });
                break;

            case 'edit-mode':
                this.$$leftscroll.show().css({ flex: '0 0 100%' });
                this.$$leftarea.css({ width: '50%' });

                this.$$rightscroll.hide();
                break;

            case 'preview-mode':
                this.$$leftscroll.hide();

                this.$$rightscroll.show().css({ flex: '0 0 100%' });
                this.$$rightarea.css({ width: '50%' });
                break;

            default:
                console.log(`Error: no ${mode}!`);
                break;
        }
    }

    undo() {
        this.codemirror.undo();
    }

    redo() {
        this.codemirror.redo();
    }

    save() {
        let title = 'webmd-download.md';

        let aLink = document.createElement('a');
        let blob = new Blob([this.codemirror.getValue()]);

        let url = window.URL.createObjectURL(blob);
        aLink.download = title;
        aLink.href = url;
        aLink.click();
        window.URL.revokeObjectURL(url);
    }

    open() {
        const $input = $('<input type="file">');

        let _this = this;
        $input.change(function () {
            let reader = new FileReader();

            reader.onload = function (evt) {
                _this.codemirror.focus();
                _this.codemirror.setValue(evt.target.result);
            };

            reader.readAsText(this.files[0]);
        })
            .click();
    }

    __highlight__() {
        // 代码高亮
        $('pre code').each(function(i, block) {

            // 代码高亮
            hljs.highlightBlock(block);

            // 代码行数
            if($(this).hasClass('lang-flow') || $(this).hasClass('has-numbering'))
                return;

            let lines = $(this).text().split('\n').length - 1;
            let $numbering = $('<ul/>').addClass('pre-numbering');

            $(this)
                .addClass('has-numbering')
                .parent()
                .append($numbering);

            for(let i = 1; i <= lines; i++) {
                $numbering.append($('<li/>').text(i + '.'));
            }
        });

        // 流程图
        $('pre .lang-flow').each(function () {
            let diagram = flowchart.parse($(this).text());
            $(this).parent('pre').append($('<div id="diagram"></div>'));
            diagram.drawSVG('diagram');
            $(this).remove();
            $('#diagram').attr('id','');
        });

        // 行内code样式
        $('code').each(function () {
            if(this.parentNode.nodeName !== 'PRE' && this.parentNode.nodeName !== 'pre') {
                $(this).css({
                    'background-color': '#cccccc',
                    'padding': '3px 5px',
                    'border-radius': '5px',
                    'font-size':'14px'
                })
            }
        });
    }

    /**
     * 分析Markdown文本
     * \ 标记文本
     * \ 高亮代码：包括序列图和流程图
     * \ LeTex数学公式渲染
     * @private
     */
    __marked__(string) {
        this.$$preview.html(this.mark(string));

        MathJax.Hub.Queue(
            [this.__highlight__],
            ["Typeset",MathJax.Hub,'zmd-preview']
        );
    }
    __preview__(string) {
        this.updateEventId ? clearTimeout(this.updateEventId) : this.__marked__(string);
        this.updateEventId = setTimeout(()=>this.__marked__(string), 350);
    }


    /**
     * 文章和预览同步滚动
     */
    __sync_scrolling__() {
        let _this = this;

        $(document).mousemove(function(e){
            _this.mouse.x = e.pageX;
            _this.mouse.y = e.pageY;
        });

        this.$$leftscroll.scroll(function () {
            if(_this.mouse.x > $(window).width()/2)
                return;

            let leftScrollPos = _this.$$leftscroll.scrollTop();

            let leftHeight = _this.$$leftarea.height() - _this.$$leftscroll.height();
            let rightHeight = _this.$$rightarea.height() - _this.$$rightscroll.height();

            _this.$$rightscroll.scrollTop((leftScrollPos / leftHeight) * rightHeight);
        });

        this.$$rightscroll.scroll(function () {
            if(_this.mouse.x < $(window).width()/2)
                return;

            let rightScrollPos = _this.$$rightscroll.scrollTop();

            let leftHeight = _this.$$leftarea.height() - _this.$$leftscroll.height();
            let rightHeight = _this.$$rightarea.height() - _this.$$rightscroll.height();

            _this.$$leftscroll.scrollTop((rightScrollPos / rightHeight) * leftHeight);
        });
    }

}

const UI =
    '        <nav class="webmd-menu">\n' +
    '            <ul id="menu-opera">\n' +
    '                <li id="webmd-bold" title="加粗"><i class="fa fa-bold"></i></li>\n' +
    '                <li id="webmd-italic" title="倾斜"><i class="fa fa-italic"></i></li>\n' +
    '                <li id="webmd-chain" title="链接"><i class="fa fa-chain"></i></li>\n' +
    '                <li id="webmd-quote" title="引用"><i class="fa fa-indent"></i></li>\n' +
    '                <li id="webmd-code" title="插入代码"><i class="fa fa-code"></i></li>\n' +
    '                <li id="webmd-math" title="插入公式"><i class="fa fa-maxcdn"></i></li>\n' +
    '                <li id="webmd-picture" title="插入图片"><i class="fa fa-image"></i></li>\n' +
    '                <li id="webmd-list-ul" title="插入无序列表"><i class="fa fa-list-ul"></i></li>\n' +
    '                <li id="webmd-list-ol" title="插入有序列表"><i class="fa fa-list-ol"></i></li>\n' +
    '                <li id="webmd-table" title="插入表单"><i class="fa fa-table"></i></li>\n' +
    '                <li id="webmd-header" title="插入标题"><i class="fa fa-header"></i></li>\n' +
    '                <li id="webmd-line" title="插入横线"><i><strong>—</strong></i></li>\n' +
    '                <li id="webmd-undo" title="撤销"><i class="fa fa-mail-reply"></i></li>\n' +
    '                <li id="webmd-redo" title="重做"><i class="fa fa-mail-forward"></i></li>\n' +
    '                <li id="webmd-open" title="打开并编辑本地的Markdown文件"><i class="fa fa-upload"></i><input id="input-file" type="file" style="display: none"></li>\n' +
    '                <li id="webmd-download" title="以文本形式保存到本地"><i class="fa fa-download"></i></li>\n' +
    '                <li id="webmd-question" title="疑问"><a class="fa fa-question-circle-o" href="https://github.com/ffiirree/zmd" target="_blank"></a></li>\n' +
    '            </ul>\n' +
    '\n' +
    '            <ul id="webmd-window">\n' +
    '                <li id="normal-mode" title="普通模式"><i class="fa fa-columns"></i></li>\n' +
    '                <li id="edit-mode" title="编辑模式"><i class="fa fa-television"></i></li>\n' +
    '                <li id="preview-mode" title="预览模式"><i class="fa fa-eye"></i></li>\n' +
    '            </ul>\n' +
    '        </nav>\n' +
    '        <div class="editor">\n' +
    '            <div id="edit-page">\n' +
    '                <div id="edit-area">\n' +
    '                    <textarea id="webmd-textarea" title="" style="display: none;"></textarea>\n' +
    '                    <div class="blank"></div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '\n' +
    '            <div id="preview-page">\n' +
    '                <div id="preview-area">\n' +
    '                    <article id="webmd-preview" class="mark"></article>\n' +
    '                    <div class="blank"></div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>';

class Menu {
    constructor(options) {
        this.editor = options.editor;
        this.codemirror = this.editor.codemirror;
        console.log(this.editor);
        this.upload = !!options.upload;

        $(linkWindow).appendTo('body');
        $(pictureWindow).appendTo('body');

        this.$$insertLink = $('#insert-link');
        this.$$insertPicture = $('#insert-picture');

        $('#webmd-header').click(()=>this.insert('# ', '一级标题', ''));
        $('#webmd-bold').click(()=>this.insert('**', '加粗文本', '**'));
        $('#webmd-italic').click(()=>this.insert('*', '斜体文本', '*'));
        $('#webmd-code').click(()=>this.insert('```\n', '代码', '\n```'));
        $('#webmd-math').click(()=>this.insert('$$', 'Tex: \\sum_i^n{x_i}', '$$'));
        $('#webmd-quote').click(()=>this.insert('> ', '引用', ''));
        $('#webmd-list-ul').click(()=>this.insert('* ', '无序列表', ''));
        $('#webmd-list-ol').click(()=>this.insert('1. ', '有序列表', ''));
        $('#webmd-table').click(()=>this.__table__());
        $('#webmd-line').click(()=>this.codemirror.doc.replaceSelection('\n------\n'));
        $('#webmd-picture').click(()=>this.$$insertPicture.show());
        $('#webmd-chain').click(()=>this.$$insertLink.show());
        options.upload ? $('.picture-url').remove() : $('.picture-upload').remove();

        // 拖拽上传
        if(options.upload) this.__enableDragUploadFile__();

        $('#link-cancel').click(()=>this.$$insertLink.hide());
        $('#picture-cancel').click(()=>this.$$insertPicture.hide());

        $('#link-ok').click(()=>this.insertLink());
        $('#picture-ok').click(()=>this.insertPicture());

        $('#webmd-undo').click(()=>this.editor.undo());
        $('#webmd-redo').click(()=>this.editor.redo());
        $('#webmd-download').click(()=>this.editor.save());
        $('#webmd-open').click(()=>this.editor.open());

        $('#normal-mode').click(()=>this.editor.setMode('normal-mode'));
        $('#preview-mode').click(()=>this.editor.setMode('preview-mode'));
        $('#edit-mode').click(()=>this.editor.setMode('edit-mode'));
    }

    insert(first, second, third) {

        let selection = this.codemirror.doc.getSelection();
        let start = this.codemirror.getCursor(true);
        let end = this.codemirror.getCursor(false);
        this.codemirror.focus();

        if(selection) {
            this.codemirror.doc.replaceSelection(first + selection + third);
            end.ch += first.length;
            start.ch += first.length;
            this.codemirror.doc.setSelection(start, end);
        }
        else {
            this.codemirror.doc.replaceSelection(first+second+third);
            this.codemirror.doc.setSelection(
                { line: start.line, ch: start.ch + first.length + second.length },
                { line: start.line, ch: start.ch + first.length }
            );
        }
    }

    __table__() {
        this.insert('\n',
            '| 表头 0  | 表头1    |  表头2  |\n' +
            '| :-----  | -----:   | :----:  |\n' +
            '| 居左    |   局右   |   居中  |\n',
            '');
    }

    insertLink() {
        const $key = $('#link-key'), $value = $('#link-value');
        const key = $key.val(), value = $value.val();

        this.insert('', '[' + key +'](' + value + ')', '');

        $key.val(''); $value.val('');
        this.$$insertLink.hide();
    }

    static __upload__(file, callback) {
        if (!file.type.match('image.*')) {
            console.log('The file is no a picture!');
            return;
        }

        let fd = new FormData();
        fd.append('file', file);
        $.ajax({
            url: '/image',
            type: "POST",
            data: fd,
            async: true,
            processData: false,
            contentType: false,
            success: callback
        });
    }

    insertPicture(){
        const $key = $('#picture-key'), $value = $('#picture-value');
        const key = $key.val();

        const _this = this;

        if(!this.upload) {
            this.insert('', '![' + key +'](' + $value.val() + ')', '');
            $key.val(''); $value.val('');
            this.$$insertPicture.hide();
        }
        else {
            const file = $value[0].files[0];
            Menu.__upload__(file, (data)=>{
                _this.insert('', '![' + key +'](' + data + ')', '');
                $key.val(''); $value.val('');
                _this.$$insertPicture.hide();
            })
        }
    }

    __enableDragUploadFile__() {
        let dropzone = document.querySelector('#picture-value');
        dropzone.addEventListener('dragover', Menu.__handleDragOver__, false);
        dropzone.addEventListener('drop', this.__handleFileSelect__, false);
    }

    static __handleDragOver__(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        evt.dataTransfer.dropEffect = 'copy';
    }

    __handleFileSelect__(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        const $key = $('#picture-key'), $value = $('#picture-value');
        const key = $key.val();

        let file = evt.dataTransfer.files[0];
        let _this = this;
        Menu.__upload__(file, (data)=>{
            _this.insert('', '![' + key +'](' + data + ')', '');
            $key.val(''); $value.val('');
            _this.$$insertPicture.hide();
        });
    }
}

const linkWindow =
    '<div id="insert-link" class="link-window-background dialog-box-background" style="display: none">\n' +
    '    <div class="link-window dialog-box">\n' +
    '        <div class="link-window-title dialog-box-title">\n' +
    '            链接\n' +
    '        </div>\n' +
    '        <div class="link-title">\n' +
    '            <input placeholder="链接描述: Google" id="link-key">\n' +
    '        </div>\n' +
    '        <div class="link-url">\n' +
    '            <input placeholder="URL: https://www.google.com.hk/" id="link-value">\n' +
    '        </div>\n' +
    '        <div class="link-window-operation">\n' +
    '            <button id="link-ok">确认</button>\n' +
    '            <button id="link-cancel">取消</button>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>';

const pictureWindow =
    '<div id="insert-picture" class="picture-window-background dialog-box-background" style="display: none">\n' +
    '    <div class="picture-window dialog-box">\n' +
    '        <div class="picture-window-title dialog-box-title">\n' +
    '            图片\n' +
    '        </div>\n' +
    '        <div class="picture-title">\n'+
    '            <input title="" placeholder="图片描述" id="picture-key">\n' +
    '        </div>\n' +
    '        <div class="picture-url">\n' +
    '            <input placeholder="URL: https://www.xxx.com/a.jpg" id="picture-value">\n' +
    '        </div>\n' +
    '        <div class="picture-upload">\n' +
    '            <div class="picture-upload-title">上传图片</div>\n' +
    '            <input type="file" id="picture-value">\n' +
    '        </div>\n' +
    '        <div class="picture-window-operation">\n' +
    '            <button id="picture-ok">确认</button>\n' +
    '            <button id="picture-cancel">取消</button>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>';
