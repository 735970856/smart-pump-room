// Keep the native select as the data source; render its popup inside the scaled dashboard.
let activeSelect=null;
document.addEventListener('pointerdown',event=>{
 if(activeSelect&&!activeSelect.root.contains(event.target))activeSelect.close();
});

export function enhanceSelect(select){
 const root=select.parentElement;
 const options=[...select.options];
 const trigger=document.createElement('button');
 const list=document.createElement('div');
 const label=document.createElement('span');
 const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 root.classList.add('soft-select');
 select.hidden=true;
 select.tabIndex=-1;
 select.setAttribute('aria-hidden','true');
 trigger.type='button';
 trigger.id=`${select.id}-trigger`;
 trigger.className='select-trigger';
 trigger.setAttribute('role','combobox');
 trigger.setAttribute('aria-label',select.getAttribute('aria-label'));
 trigger.setAttribute('aria-haspopup','listbox');
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-controls',`${select.id}-listbox`);
 label.className='select-value';
 label.textContent=options[select.selectedIndex]?.textContent||'';
 arrow.setAttribute('viewBox','0 0 16 16');
 arrow.setAttribute('aria-hidden','true');
 arrow.classList.add('select-arrow');
 path.setAttribute('d','m4 6 4 4 4-4');
 arrow.append(path);
 trigger.append(label,arrow);
 list.id=`${select.id}-listbox`;
 list.className='select-dropdown';
 list.setAttribute('role','listbox');
 list.setAttribute('aria-label',select.getAttribute('aria-label'));
 list.hidden=true;
 const items=options.map((option,index)=>{
  const item=document.createElement('div');
  item.id=`${select.id}-option-${index}`;
  item.className='select-option';
  item.setAttribute('role','option');
  item.setAttribute('aria-selected',String(option.selected));
  item.dataset.index=index;
  item.textContent=option.textContent;
  list.append(item);
  return item;
 });
 root.append(trigger,list);
 let index=Math.max(0,select.selectedIndex),query='',lastTyped=0;
 const controller={root,close};
 function highlight(next,scroll=true){
  index=Math.max(0,Math.min(items.length-1,next));
  items.forEach((item,i)=>item.classList.toggle('is-active',i===index));
  trigger.setAttribute('aria-activedescendant',items[index].id);
  if(scroll)items[index].scrollIntoView({block:'nearest'});
 }
 function open(){
  if(activeSelect&&activeSelect!==controller)activeSelect.close();
  activeSelect=controller;
  root.classList.add('is-open');
  trigger.setAttribute('aria-expanded','true');
  list.hidden=false;
  highlight(Math.max(0,select.selectedIndex));
 }
 function close(){
  list.hidden=true;
  root.classList.remove('is-open');
  trigger.setAttribute('aria-expanded','false');
  trigger.removeAttribute('aria-activedescendant');
  if(activeSelect===controller)activeSelect=null;
 }
 function choose(next){
  close();
  if(select.selectedIndex!==next){
   select.selectedIndex=next;
   select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  // Filtering rebuilds the panel; return focus to the replacement combobox.
  document.getElementById(trigger.id)?.focus({preventScroll:true});
 }
 trigger.addEventListener('click',()=>list.hidden?open():close());
 list.addEventListener('mousedown',event=>event.preventDefault());
 list.addEventListener('click',event=>{
  const item=event.target.closest('.select-option');
  if(item)choose(Number(item.dataset.index));
 });
 trigger.addEventListener('keydown',event=>{
  const key=event.key;
  if(key==='Tab'){close();return;}
  if(key==='Escape'){if(!list.hidden){event.preventDefault();event.stopPropagation();close();}return;}
  if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)){
   event.preventDefault();event.stopPropagation();
   const wasOpen=!list.hidden;
   if(!wasOpen)open();
   if(key==='Home')highlight(0);
   else if(key==='End')highlight(items.length-1);
   else if(key==='ArrowDown'&&wasOpen)highlight(index+1);
   else if(key==='ArrowUp'&&wasOpen)highlight(index-1);
   else if((key==='Enter'||key===' ')&&wasOpen)choose(index);
   return;
  }
  if(key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   event.preventDefault();
   const now=performance.now();query=now-lastTyped<700?query+key:key;lastTyped=now;
   if(list.hidden)open();
   const match=options.findIndex(option=>option.textContent.toLowerCase().startsWith(query.toLowerCase()));
   if(match>=0)highlight(match);
  }
 });
 trigger.addEventListener('blur',close);
}
