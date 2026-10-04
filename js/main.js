const CONTENT_API_URL = "https://docs.google.com/spreadsheets/d/1FPDlW0ugDgBLds5AD86sTo-Arw0r9T4cJZ8b4Vl5s5w/gviz/tq?tqx=out:json&sheet=Blog%26Articles";

async function loadWebsiteContent(){
  if(!CONTENT_API_URL || CONTENT_API_URL.includes('PASTE_YOUR_CONTENT')) return;
  try{
    const response=await fetch(CONTENT_API_URL,{cache:'no-store'});
    if(!response.ok) throw new Error('Content API error');

    if(CONTENT_API_URL.includes('docs.google.com/spreadsheets')){
      const rawText=await response.text();
      const jsonMatch=rawText.match(/\{[\s\S]*\}$/);
      if(!jsonMatch) throw new Error('Unable to parse Google Sheet content');
      const data=JSON.parse(jsonMatch[0]);
      const columns=(data.table?.cols||[]).map(col=>String(col.label||col.id||'').trim()).filter(Boolean);
      const rows=data.table?.rows||[];

      const items=rows.map(row=>{
        const cells=row.c||[];
        const obj={};
        columns.forEach((column,index)=>{
          obj[column]=cells[index] && typeof cells[index].v !== 'undefined' ? String(cells[index].v) : '';
        });
        return normalizeContentItem(obj);
      }).filter(x=>x.title && x.published!=='no' && x.published!=='false' && x.published!=='draft');

      if(items.length) renderCMS(items);
      return;
    }

    const data=await response.json();
    const items=(Array.isArray(data)?data:(data.items||[])).map(normalizeContentItem)
      .filter(x=>x.title && x.published!=='no' && x.published!=='false' && x.published!=='draft');
    if(items.length) renderCMS(items);
  }catch(error){
    console.warn('Content sheet could not be loaded. Static website content remains active.',error);
  }
}
