let cachedData = [];
let currentAmountOrder = "desc";
let currentDateOrder ="desc";
let currentTypeOrder ="income"

function getAllRecords() {
    console.log("✅ 開始查詢資料");

    fetch("https://api.minamicode.dev/api/records")
        .then(response => response.json())
        .then(data => {
            console.log("✅ 拿到資料：", data);
            cachedData = data; // 存下來給排序用
            renderTable(data);
        })
        .catch(error => {
            console.error("❌ 查詢失敗", error);
            alert("資料載入失敗");
        });
}

function renderTable(data){
    const tableBody=document.getElementById("tableBody");
    tableBody.innerHTML = "";
    data.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox" class="delete-checkbox" value="${record.id}"></td>
            <td>${record.id ?? '-'}</td>
            <td ondblclick="makeEditable(this)">${record.day}</td>
            <td ondblclick="makeEditable(this)">${record.type}</td>
            <td ondblclick="makeEditable(this)">${record.category}</td>
            <td ondblclick="makeEditable(this)">${record.amount}</td>
            <td ondblclick="makeEditable(this)">${record.note}</td>
        `;
        tableBody.appendChild(row);
    });
}

///價格高低排序
function sortByAmount(){
    if(currentAmountOrder==="desc"){
        cachedData.sort((a,b)=>a.amount-b.amount);
        currentAmountOrder="asc"
    }
    else{
        cachedData.sort((a,b)=>b.amount-a.amount);
        currentAmountOrder="desc"
    }

    renderTable(cachedData);
}

///收入支出排序
function sortByType(){
    if(currentTypeOrder==="income"){
        cachedData.sort((a,b)=>{
            if(a.type===b.type)return 0;
            return a.type==="收入"?-1:1;
        });
        currentTypeOrder="expense"
    }
    else{
        cachedData.sort((a,b)=>{
            if(a.type===b.type)return 0;
            return a.type==="支出"?-1:1
        });
        currentTypeOrder="income"
    }

    renderTable(cachedData);
}

///日期新舊排序
function sortByDate(){
    if(currentDateOrder==="desc"){
        cachedData.sort((a,b)=>new Date(a.day)-new Date(b.day));
        currentDateOrder="asc"
    }
    else{
        cachedData.sort((a,b)=>new Date(b.day)-new Date(a.day));
        currentDateOrder="desc"
    }

    renderTable(cachedData);
}

///刪除資料的Button
function deleteSelectedRecords(){
    const checkboxes=document.querySelectorAll(".delete-checkbox:checked");
    const idsToDelete=Array.from(checkboxes).map(cb=>cb.value);

    if(idsToDelete.length===0){
        alert("請先勾選要刪除的資料！")
        return;
    }
    
    const confirmed=confirm(`確定要刪除${idsToDelete.length}筆資料嗎？`);
    if(!confirmed)return;

    Promise.all(idsToDelete.map(id=>
        fetch(`https://api.minamicode.dev/api/records/delete/${id}`)
    ))
    .then(()=>{
        alert("✅資料已刪除");
        getAllRecords();
    })
    .catch(error=>{
        console.error("❌ 刪除失敗", error);
        alert("刪除資料時發生錯誤");
    })
}

///可以選取表格裡的資料並修改
function makeEditable(cell){
    const oldValue=cell.innerText;
    const input=document.createElement("input");
    input.type="text";
    input.value=oldValue;
    input.style.width="100%";

    ///當輸入匡失去焦點(bler)時，回原為遠來的樣子
    input.addEventListener("blur",function(){
        cell.innerText=input.value||oldValue;
    });

    ///按下Enter時也會觸發儲存（但還不更新資料庫）
    input.addEventListener("keydown",function(e){
        if(e.key==="Enter"){
            cell.innerText=input.value||oldValue;
            input.blur();///模擬離開輸入匡
        }
    });

    cell.innerText="";///清空原本的cell內容
    cell.appendChild(input);///將Input放入cell中
    input.focus();///自動選取輸入匡
}

//儲存變更
function saveEditedRecord(){
    const checkboxes=document.querySelectorAll(".delete-checkbox:checked");

    if(checkboxes.length!==1){
        alert("請勾選『一筆』要儲存的資料")
        return;
    }
    const id=checkboxes[0].value;
    const row=checkboxes[0].closest("tr");
    const cells=row.querySelectorAll("td");

    const updatedRecord={
        id:parseInt(id),
        day:cells[2].innerText.trim(),
        type:cells[3].innerText.trim(),
        category:cells[4].innerText.trim(),
        amount:parseFloat(cells[5].innerText.trim()),
        note:cells[6].innerText.trim()
    };

    fetch(`https://api.minamicode.dev/api/records/${id}`,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(updatedRecord)
    })
    .then(response=>response.text())
    .then(result=>{
        alert("✅資料更新成功！");
        getAllRecords();
    })
    .catch(error=>{
        console.error("❌更新失敗",error);
        alert("更新失敗，請稍後再試");
    });
}

//開啟新增頁面
function openAddForm() {
    document.getElementById("overlay").classList.remove("hidden"); // 顯示 overlay
}

//關閉新增頁面
function closeAddForm() {
    document.getElementById("overlay").classList.add("hidden"); // 隱藏 overlay
}

//將新增資料上傳至資料庫
function confirmAdd(){
    //1.取得輸入欄位得值
    const day=document.getElementById("newDay").value;
    const type=document.getElementById("newType").value.trim();
    const category=document.getElementById("newCategory").value.trim();
    const amount=parseFloat(document.getElementById("newAmount").value);
    const note=document.getElementById("newNote").value.trim();

    //2.防呆檢查
    if(!day||!type||!category||isNaN(amount)){
        alert("請完整填寫日期、日期、分類與金額")
        return;
    }

    //3.組成要傳送的物件
        const newRecord={
            day:day,
            type:type,
            category:category,
            amount:amount,
            note:note
        };
    //4.傳送POST至後端
    fetch("https://api.minamicode.dev/api/records",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(newRecord)
    })
    .then(response=>response.text())
    .then(result=>{
        alert("✅資料新增成功");
        closeAddForm();//關閉表單
        clearAddForm();//清空欄位
        getAllRecords();//重新載入資料
    })
    .catch(error=>{
        console.error("❌新增失敗",error);
        alert("新增資料時發生錯誤")
    });
}

//清空新增裡剛剛填的資料
function clearAddForm(){
    document.getElementById("newDay").value="";
    document.getElementById("newType").value="";
    document.getElementById("newCategory").value="";
    document.getElementById("newAmount").value="";
    document.getElementById("newNote").value="";
}

//只顯示支出
function onlyShowExp(){
    const filtered=cachedData.filter(record=>record.type==="支出");
    renderTable(filtered);
}

//只顯示收入
function onlyShowInc(){
    const filtered=cachedData.filter(record=>record.type==="收入");
    renderTable(filtered);
}

//備註的關鍵字查詢
function searchByNote(){
    const keyword=document.getElementById("noteKeyword").value.trim();
    if(!keyword){
        alert("請輸入要查詢的備註關鍵字");
        return;
    }
    fetch(`https://api.minamicode.dev/api/records/search?note=${encodeURIComponent(keyword)}`)
    .then(response=>response.json())
    .then(data=>{
        console.log("🔍 備註查詢結果：",data)
        renderTable(data);
    })
    .catch(error=>{
        console.error("❌ 查詢備註失敗",error);
        alert("查詢失敗，請稍後再試");
    })
}

//查詢日期區間
function searchByDateRange(){
    const start=document.getElementById("startDate").value;
    const end=document.getElementById("endDate").value;

    if(!start||!end){
        alert("請選擇起點和結束日期")
        return;
    }
    fetch(`https://api.minamicode.dev/api/records/between?start=${start}&end=${end}`)
    .then(response=>response.json())
    .then(data=>{
        console.log("📅 區間查詢結果：",data);
        renderTable(data);
    })
    .catch(error=>{
        console.error("❌ 查詢日期區間失敗",error);
        alert("查詢失敗，請稍後再試");
    });
}