import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MyTinyMceAngular';
  editorConfig = {
    height: 500,
    menubar: false,
    inline: true,
    selector: 'div[contenteditable]',
    fixed_toolbar_container: '#tinymce-toolbar',
    plugins: [
      'advlist autolink lists link image charmap print preview anchor',
      'searchreplace visualblocks code fullscreen',
      'insertdatetime media table paste code help wordcount'
    ],
    toolbar:
      'undo redo | formatselect | bold italic backcolor | \
      alignleft aligncenter alignright alignjustify | \
      bullist numlist outdent indent | removeformat | help'
  };

  private fontItems = '8px 10px 11px 12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 38px 42px 48px 72px'.split(' ').map(size => ({
    text: size,
    value: size
  }));

  getConfig(simple = true) {
    let toolbar = 'undo redo | formatselect | bold italic backcolor | \
        bullist numlist outdent indent | help';
    let plugins = [
      'paste code help'
    ];
    let selector = 'div[contenteditable][data-richtext-mode="simple"]';

    if (!simple) {
      toolbar = 'undo redo | formatselect | bold italic backcolor | \
            alignleft aligncenter alignright alignjustify | \
            bullist numlist outdent indent | removeformat | help';
      plugins = [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount'
      ];
      selector = 'div[contenteditable]:not([data-richtext-mode="simple"])';
    }
    console.log('getConfig ', simple, selector);
    const config = {
      height: 500,
      menubar: false,
      inline: true,
      selector,
      fixed_toolbar_container: '#tinymce-toolbar',
      plugins,
      toolbar,
    };
    return config;
  }

  getConfig1(simple = true) {
    console.log('getConfig ', simple);
    const plugins = [
      'charmap',
      'lists',
      'colorpicker',
      'textcolor',
      'image'
    ];
    let toolbar = 'fontselect | fontsize | forecolor | bold | italic | underline | strikethrough | subscript | superscript | charmap | personalizationDropdown | image';
    let selector = '[module_guid] [cbn-editable="richtext"][richtext-mode="simple"] div[contenteditable="true"]';

    if (!simple) {
      plugins.push('link');
      toolbar = 'fontselect | fontsize | forecolor | bold | italic | underline | strikethrough | subscript | superscript | link | unlink | charmap | personalizationDropdown | image';
      selector = '[module_guid] [cbn-editable="richtext"]:not([richtext-mode="simple"]) div[contenteditable="true"]';
    }

    const config = {
      selector,
      menubar: false,
      inline: true,
      plugins,
      image_list: [{title: 'right arrow', value: 'https://www.svgrepo.com/show/221989/right-arrow-next.svg'}],
      target_list: false,
      link_title: false,
      fixed_toolbar_container: '#tinymce-toolbar',
      toolbar,
      style_formats_merge: true,
      valid_styles: {
        '*': 'font-size,font-family,color,text-decoration,text-align,font-weight,line-height,margin'
      },
      content_css: [
        'http://fonts.googleapis.com/css?family=Lato:300,300i,400,400i'
      ],
      content_style: 'sup { vertical-align: text-top .6em; line-height: .6em; font-size: 60%; top :.1em; }, div { z-index : 1}, .tox-notifications-container { display: none !important}',
      fontsize_formats: '6pt 8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 22pt 24pt 26pt 28pt 30pt 32pt 36pt 48pt 60pt 72pt',
      forced_root_block: '',
      paste_data_images: false,
      convert_urls: false,
      setup(editor) {
        const getSpecifiedFontProp = (propName, rootElm, elm) => {
          while (elm !== rootElm) {
            if (elm.style[propName]) {
              return elm.style[propName];
            }
            elm = elm.parentNode;
          }
          return 0;
        };

        const getComputedFontProp = (propName, elm) => {
          // return tinyMCE.DOM.getStyle(elm, propName, true)
        };

        const getFontSize = (rootElm, elm) => {
          return getSpecifiedFontProp('fontSize', rootElm, elm) || getComputedFontProp('fontSize', elm);
        };

        const createFontSizeListBoxChangeHandler = () => {
          return function() {
            editor.on('nodeChange', (e) => {
              const px = getFontSize(editor.getBody(), e.element);
              this.value(px);

              if (!px) {
                this.$el.find('.mce-ico').show();
                this.text('');
              } else {
                this.$el.find('.mce-ico').hide();
                this.text(px);
              }
            });
          };
        };

        editor.on('Change', (e) => {
          // $(editor.contentDocument).find('span').css('line-height', '120%');
        }),
          editor.addButton('fontsize', {
            type: 'combobox',
            placeholder: 'Font size',
            tooltip: 'Font size',
            values: this.fontItems,
            onPostRender: createFontSizeListBoxChangeHandler(),
            onselect(e) {
              editor.execCommand('fontSize', false, this.value());
            },
            onfocusout(e) {
              if (this.value().length) {
                const fontSize = parseInt(this.value(), 10);
                if (fontSize >= 6 && fontSize <= 500) {
                  editor.execCommand('fontSize', false, fontSize + 'px');
                }
              }
            },
            onkeydown(e) {
              if ((e.key === 'Tab' || e.key === 'Enter') && (this.value().length)) {
                const fontSize = parseInt(this.value(), 10);
                if (fontSize >= 6 && fontSize <= 500) {
                  editor.execCommand('fontSize', false, fontSize + 'px');
                }
              }
            }
          });
      }
    };

    return config;
  }
}
