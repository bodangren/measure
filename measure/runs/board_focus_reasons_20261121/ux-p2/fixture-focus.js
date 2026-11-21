(() => {
  const button=document.querySelector('[data-action="open-comment"][data-key$="/gate_delete-file"]')
  if(!button)throw new Error('The deletion gate fixture comment control is absent.')
  button.click()
  const area=document.querySelector('textarea.comment-input')
  area.scrollIntoView({block:'center'})
  area.focus()
  area.value='Fixture audit draft omega'
  area.dispatchEvent(new Event('input',{bubbles:true}))
  area.setSelectionRange(6,6)
  const audit=window.__p2={area,events:[],rootChanges:0}
  new MutationObserver(records=>{audit.rootChanges+=records.length;audit.events.push({at:new Date().toISOString(),type:'root-change',count:records.length})})
    .observe(document.querySelector('#root'),{subtree:true,childList:true,attributes:true,characterData:true})
  for(const type of ['focusin','focusout','input','keydown'])document.addEventListener(type,e=>{
    audit.events.push({at:new Date().toISOString(),type,tag:e.target.tagName,key:e.key,value:area.value,start:area.selectionStart,end:area.selectionEnd})
  },true)
  addEventListener('message',e=>audit.events.push({at:new Date().toISOString(),type:'host-message',messageType:e.data?.type}))
  return {at:new Date().toISOString(),key:area.dataset.key,value:area.value,start:area.selectionStart,end:area.selectionEnd,focus:document.activeElement===area,documentFocus:document.hasFocus()}
})()
