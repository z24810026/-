document.addEventListener("DOMContentLoaded",function(){
    fetch("https://minamicode.dev/api/records")
    .then(response=>response.json())
    .then(data=>{
        let totalIncome = 0;
        let totalExpense = 0;
        data.forEach(record=>{
            if(record.type==="收入"){
                totalIncome+=record.amount;
            }
            else if(record.type==="支出"){
                totalExpense+=record.amount;
            }
        });
        
        const totalAsset=totalIncome-totalExpense;

        document.getElementById("totalAssetAmount").textContent="$"+totalAsset;
        document.getElementById("totalIncomeAmount").textContent="$"+totalIncome;
        document.getElementById("totalExpenseAmount").textContent="$"+totalExpense;
    })
    .catch(error=>{
        console.error("資料讀取失敗",error);
    });
});