export default
  // Stripped-down version of quill.snow.css
  `
/*!
 * Quill Editor v1.3.6
 * https://quilljs.com/
 * Copyright (c) 2014, Jason Chen
 * Copyright (c) 2013, salesforce.com
 */
.ql-container {
  box-sizing: border-box;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 13px;
  height: 100%;
  margin: 0px;
  position: relative;
}
.ql-editor {
  box-sizing: border-box;
  line-height: 1.42;
  height: 100%;
  outline: none;
  overflow-y: auto;
  padding: 12px 15px;
  tab-size: 4;
  -moz-tab-size: 4;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.ql-editor > * {
  cursor: text;
}
.ql-editor p,
.ql-editor ol,
.ql-editor ul,
.ql-editor pre,
.ql-editor blockquote,
.ql-editor h1,
.ql-editor h2,
.ql-editor h3,
.ql-editor h4,
.ql-editor h5,
.ql-editor h6 {
  margin: 0;
  padding: 0;
  counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
}
.ql-clipboard {
  display: none;
}
`

  +
  // quill-cursors.css
  `
/********
* VARS *
********/
/**********
* MIXINS *
**********/
/***********
* CURSORS *
***********/
.ql-container {
 position: relative;
 display: flex;
 flex: 1;
 flex-direction: column; }

.ql-editor {
 position: relative;
 position: relative;
 flex: 1;
 outline: none;
 tab-size: 4;
 white-space: pre-wrap; }

.ql-cursor.hidden {
 display: none; }

.ql-cursor .ql-cursor-caret-container,
.ql-cursor .ql-cursor-flag {
 position: absolute; }

.ql-cursor .ql-cursor-flag {
 z-index: 1;
 transform: translate3d(-1px, -100%, 0);
 opacity: 0;
 visibility: hidden;
 color: white;
 padding-bottom: 2px; }
 @media screen {
   .ql-cursor .ql-cursor-flag {
     transition: opacity 0ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms, visibility 0ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms; } }
 .ql-cursor .ql-cursor-flag .ql-cursor-name {
   margin-left: 5px;
   margin-right: 2.5px;
   display: inline-block;
   margin-top: -2px; }
 .ql-cursor .ql-cursor-flag .ql-cursor-flag-flap {
   display: inline-block;
   z-index: -1;
   width: 5px;
   position: absolute;
   top: 0;
   bottom: 0;
   right: -2.5px;
   border-radius: 3px;
   background-color: inherit; }

.ql-cursor .ql-cursor-flag:hover,
.ql-cursor .ql-cursor-caret-container:hover + .ql-cursor-flag {
 opacity: 1;
 visibility: visible;
 transition: none; }

.ql-cursor .ql-cursor-caret-container {
 margin-left: -9px;
 padding: 0 9px;
 z-index: 1; }
 .ql-cursor .ql-cursor-caret-container .ql-cursor-caret {
   position: absolute;
   top: 0;
   bottom: 0;
   width: 2px;
   margin-left: -1px;
   background-color: attr(data-color); }

.ql-cursor .ql-cursor-selection-block {
 position: absolute; }
`;
