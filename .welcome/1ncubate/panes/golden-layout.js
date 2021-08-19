//show-preview
import { appendUrls, consoleHelper, htmlToElement, importCSS } from '../../.tools/misc.mjs';
import 	'../../shared.styl';
consoleHelper();

const goldenLayoutUrls = [
  './golden-layout.css',
  'https://unpkg.com/zepto@1.2.0/dist/zepto.js',
  'https://unpkg.com/zepto@1.2.0/src/selector.js',
  'https://unpkg.com/golden-layout@1.5.9/dist/goldenlayout.min.js',
  "https://unpkg.com/golden-layout@1.5.9/src/css/goldenlayout-base.css",
  "https://unpkg.com/golden-layout@1.5.9/src/css/goldenlayout-dark-theme.css"
];

/*
outerWidth issue potential fix: https://gist.github.com/alanhogan/3935463
*/
const fakeJQuery = () => {
  $.noConflict = () => $;
  $.fn["outerWidth"] = () => {};
  $.fn["innerHeight"] = () => {};
  
  //delete $.extend;
  //delete $.contains;
  //delete $.type;
  //delete $.trim;
  //delete $.map;
  //delete $.each;
  //delete $.fn.on;
  //delete $.fn.unbind;
  //delete $.fn.one;
  //delete $.fn.off;

  delete $.isFunction;
  delete $.isWindow;
  delete $.isArray;
  delete $.isPlainObject;
  delete $.isEmptyObject;
  delete $.isNumeric;
  delete $.inArray;
  delete $.camelCase;
  delete $.uuid;
  delete $.support;
  delete $.expr;
  delete $.noop;
  delete $.grep;
  delete $.event;
  delete $.proxy;
  delete $.fn.delegate;
  delete $.fn.undelegate;
  delete $.fn.live;
  delete $.fn.die;
  delete $.fn.trigger;
  delete $.fn.triggerHandler;
  delete $.fn.Event;
  delete $.fn.load;
  delete $.fn.serializeArray;
  delete $.fn.serialize;
  delete $.fn.submit;
  delete $.ajax;
  delete $.ajaxJSONP;
  delete $.ajaxSettings;
  delete $.get;
  delete $.post;
  delete $.getJSON;
  delete $.param;
};

const createLayout1 = () => {
  var config = {
    settings: {
      showCloseIcon: false,
      showMaximiseIcon: false,
      showPopoutIcon: false
    },
    dimensions: {
        headerHeight: 30
    },
    content: [{
      type: 'row',
      content: [{
        type: 'column',
        name: 'explorer',
        id: 'explorer',
        width: 17,
        content: [{
            type:'component',
            isClosable: false,
            componentName: 'h2component',
            title: 'EXPLORER',
            componentState: { text: 'tree' }
        }]
      },{
        type: 'column',
        name: 'editor',
        content: [{
        type: 'stack',
        id: 'editor',
        content: [{
            type:'component',
            isClosable: false,
            componentName: 'h2component',
            title: 'scratch.md',
            componentState: { text: 'scratch.md' }
          }, {
            type:'component',
            isClosable: false,
            componentName: 'h2component',
            title: 'foo.jpg',
            componentState: { text: 'foo.jpg' }
          }, {
            type:'component',
            isClosable: false,
            componentName: 'h2component',
            title: 'funky.mp4',
            componentState: { text: 'funky.mp4' },
          }]
        }]
      },{
        type: 'column',
        name: 'terminal',
        width: 35,
        content: [{
          type: 'column',
          content: [{
            type:'component',
            isClosable: false,
            componentName: 'h2component',
            id: 'terminal1',
            title: 'terminal 1',
            componentState: { text: 'terminal 1' }
          }, {
            type:'component',
            isClosable: false,
            componentName: 'h2component',
            id: 'terminal2',
            title: 'terminal 2',
            componentState: { text: 'terminal 2' }
          }]
        }]
      }]
    }]
  };
  const root = document.createElement('div');
  root.id="root";
  document.body.appendChild(root);

  var myLayout = new GoldenLayout( config, root );

  myLayout.registerComponent( 'h2component', function( container, state ){
    container.getElement().html( '<h2>' + state.text + '</h2>');
  });
  
  myLayout.on( 'itemCreated', function( item ){
    if( ['explorer', 'editor'].includes(item.config.id)){
      item.element.addClass(item.config.id);
    }
    if( ['terminal1', 'terminal2'].includes(item.config.id)){
      item.element.closest('.lm_item').addClass(item.config.id);
    }
  });

  try {
    myLayout.init();
  } catch(e){
    console.trace(e);
  }
  
  window.addEventListener('resize', () => myLayout.updateSize(
    root.outerWidth,
    root.outerHeight
  ));
}

(async () => {
  await appendUrls(goldenLayoutUrls);
  fakeJQuery();
  createLayout1();
})()