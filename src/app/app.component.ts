import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component, ComponentFactory, ComponentFactoryResolver, ComponentRef,
  DoCheck, HostListener,
  OnChanges,
  OnDestroy, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { EditorComponent } from '@tinymce/tinymce-angular';

import fallbackFonts from './fallbackFonts';

declare const $;

// tslint:disable-next-line:no-conflicting-lifecycle
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  entryComponents: [
    EditorComponent
  ]
})
export class AppComponent implements OnChanges, DoCheck, AfterContentInit,
  AfterContentChecked, AfterViewInit, AfterViewChecked, OnDestroy, OnInit {
  title = 'MyTinyMceAngular';
  @ViewChild('editorContainer', { read: ViewContainerRef }) editorContainer;
  @ViewChild('modulesContainer', { read: ViewContainerRef }) modulesContainer;
  editorComponentRef: ComponentRef<EditorComponent>;
  selectedFont: string = '';
  fallbackFontString: string = '';

  constructor(private resolver: ComponentFactoryResolver) {
    console.log('>>> constructor<AppComponent>');
  }

  getSampleEditorConfig(simple = true) {
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
      base_url: '/tinymce',
      selector,
      forced_root_block: '',
      fixed_toolbar_container: '#tinymce-toolbar',
      plugins,
      toolbar,
    };
    return config;
  }

  processExternalFonts(externalFonts = '') {
    if (externalFonts.trim().length === 0) {
      return '';
    }
    externalFonts = externalFonts.replace(/;=/g, '=');
    const fonts = externalFonts.split(';');
    return fonts.filter(font => font.trim() !== '')
      .map(font => {
        font = font.trim();
        const fontsMap = font.split('=');

        const splits = fontsMap[0].split('|');
        if (splits[1]) {
          const fontNameAndWeight = fontsMap[0];
          const fontFamilySplits = fontsMap[1].split('|');
          const fontFamily = fontFamilySplits.length === 2 ? fontFamilySplits[1] : fontFamilySplits[0];
          const fontAndWeightDisplayText = fontNameAndWeight.replace('|', '-');
          const uniqueFontAndWeightText = fontNameAndWeight.trim().replace(/\s+\|\s+/g, '__');
          font = fontAndWeightDisplayText + '=' + uniqueFontAndWeightText + ',' + fontFamily;
        }
        return font;
      }).join(';');
  }

  fallbackFontsFromOptions(options: {value: string, content: string}[]) {
    if (!options || options.length < 1) {
      return '';
    }
    return options.map(option => option.content + '=' + option.value).join(';') + ';';
  }

  getFallbackFonts() {
    if (!this.fallbackFontString) {
      this.fallbackFontString = this.fallbackFontsFromOptions(fallbackFonts.options);
    }
    return this.fallbackFontString;
  }

  getEditorConfig(simple = true) {
    console.log('getConfig ', simple);
    const fontItems = '8px 10px 11px 12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 38px 42px 48px 72px'.split(' ').map(size => ({
      text: size,
      value: size
    }));

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

    const externalFonts = this.processExternalFonts(fallbackFonts.external_fonts.trim());
    let fonts = externalFonts.trim() !== '' ? this.getFallbackFonts() + externalFonts : this.getFallbackFonts();
    fonts = fonts.replace(/;=/g, '=');

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
      font_formats: fonts,
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
            values: fontItems,
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

  openTiny(el) {
    if (el) {
      const currentChild = el.firstElementChild;
      let editorElement = null;
      if ( currentChild && currentChild.id && currentChild.hasAttribute('_tinyedit') ) {
        editorElement = currentChild;
      } else {
        editorElement = document.createElement('div');
        const editorId = this.create_UUID();
        editorElement.setAttribute('id', editorId);
        editorElement.setAttribute('_tinyedit', '');
        editorElement.setAttribute('spellcheck', false);
        editorElement.setAttribute('contenteditable', true);
        const content = el.innerHTML;
        el.innerHTML = '';
        editorElement.innerHTML = content;
        el.appendChild(editorElement);
      }

      if (!editorElement.classList.contains('mce-edit-focus')) {
        const richTextElement = el;
        const type = richTextElement.getAttribute('richtext-mode');
        const data = richTextElement.getAttribute('data-richtext');
        const isSimple = type && type === 'simple';
        const isCta = data && data.toLowerCase().indexOf('cta') > -1;
        const config = this.getEditorConfig(isSimple || isCta);

        this.showTiny(editorElement, config);
      }
    }
  }

  clearEditor() {
    this.editorContainer.clear();
    if (this.editorComponentRef) {
      this.editorComponentRef.destroy();
    }
  }

  showTiny(el, config) {
    this.clearEditor();
    const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(EditorComponent);
    this.editorComponentRef = this.editorContainer.createComponent(factory);
    const editorConfig = {...config};
    editorConfig.selector = '#' + el.id;
    this.editorComponentRef.instance.init = editorConfig;
    this.editorComponentRef.instance.onInit.subscribe((e) => {
      console.log('>> Editoir init', e.editor);
      const ed = e.editor;
      if (ed) {
        ed.fire('focusin');
        // ed.selection.select(ed.getBody(), true);
        // ed.selection.collapse(false);
      }
    });
  }

  addFont() {
    // const font = $('#font').val().trim();
    console.log('AddFont ', this.selectedFont);
    if (this.selectedFont) {
      const fn = this.selectedFont + '=' + this.selectedFont + ';';
      if (fallbackFonts.external_fonts.indexOf(this.selectedFont) === -1) {
        fallbackFonts.external_fonts += fn;
      }
      this.clearEditor();
    }
  }

  create_UUID() {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : ( r & 0x3 | 0x8)).toString(16);
    });
    return uuid;

  }

  addModule() {
    const uuid = this.create_UUID();
    $(`<div class="module-container" module_guid="m_` + uuid + `">
      <div id="module4">
        <table layout-row="true" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
          <tbody><tr layout-row="true">
            <td align="left" style="padding: 0px 20px 0px 20px;" class="pad20rl mobile_h1 match" data-groupid="h1">
              <h1 style="font-size: 14px; margin: 0px; font-weight: normal; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0px; text-transform: none">
                <span id="mymodule1" style="color: #000000; font-size: 14px; line-height: 120%; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;" cbn-editable="richtext" data-richtext="h1_text">
                  <div id="` + uuid + `" spellcheck="false" contenteditable="true" _tinyedit>
                    <span style="font-size: 50px; line-height: 120%">H1 Text</span>
                  </div>
                </span>
              </h1>
            </td>
        </tr></tbody>
      </table>
    </div>
    </div>`).appendTo('#module-scroll');
  }

  addCTA() {
    const uuid = this.create_UUID();
    $(`<div class="module-container" module_guid="m_` + uuid + `">
      <div id="module4">
        <table layout-row="true" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
          <tbody><tr layout-row="true">
            <td align="left" style="padding: 0px 20px 0px 20px;" class="pad20rl mobile_h1 match" data-groupid="h1">
              <h1 style="font-size: 14px; margin: 0px; font-weight: normal; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0px; text-transform: none">
                <span id="mymodule1" style="color: #000000; font-size: 14px; line-height: 120%; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;" cbn-editable="richtext" data-richtext="h1_text" richtext-mode="simple">
                  <div id="` + uuid + `" spellcheck="false" contenteditable="true" _tinyedit>
                    Right CTA
                  </div>
                </span>
              </h1>
            </td>
          </tr></tbody>
        </table>
      </div>
  </div>`).appendTo('#module-scroll');
  }

  ngOnChanges() {
    console.log('>>> ngOnChanges');
  }

  ngOnInit() {
    console.log('>>> ngOnInt');
  }

  ngDoCheck() {
    // console.log('>>> ngDoCheck');
  }
  ngAfterContentInit() {
    // console.log('>>> ngAfterContentInit');
  }
  ngAfterContentChecked() {
    // console.log('>>> ngAfterContentChecked');
  }
  ngAfterViewInit() {
    // console.log('>>> ngAfterViewInit');
  }
  ngAfterViewChecked() {
    // console.log('>>> ngAfterViewChecked');
  }
  ngOnDestroy() {
    // console.log('>>> ngOnDestroy');
    this.editorComponentRef.destroy();
  }

  @HostListener('click', ['$event']) onClick(e) {
    const richTextElem = e.target.closest('[cbn-editable]');
    if (richTextElem) {
      console.log('Opening tinymce');
      this.openTiny(richTextElem);
    }
  }
}
