document.addEventListener("DOMContentLoaded", function() {
    let transactions = [];

    const form = document.getElementById("transactionForm");
    const tableBody = document.querySelector("#transactionTable tbody");
    const totalIncomeEl = document.getElementById("totalIncome");
    const totalExpenseEl = document.getElementById("totalExpense");
    const balanceEl = document.getElementById("balance");
    const themeToggle = document.getElementById("themeToggle");
    const exportBtn = document.getElementById("exportBtn");

    let pieChart = null, lineChart = null, monthlyChart = null;
    const overspendingThreshold = 5000; // alert if a category > threshold

    // Dark/Light toggle
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        themeToggle.innerHTML = document.body.classList.contains("dark-mode") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Sample transactions
    const sampleTransactions = [
        {date:"2025-10-20", type:"Income", category:"Salary", amount:50000, note:"October Salary"},
        {date:"2025-10-21", type:"Expense", category:"Food", amount:1200, note:"Groceries"},
        {date:"2025-10-21", type:"Expense", category:"Transport", amount:500, note:"Taxi/Bus"},
        {date:"2025-10-22", type:"Income", category:"Freelance", amount:8000, note:"Project Payment"},
        {date:"2025-10-22", type:"Expense", category:"Entertainment", amount:1500, note:"Movies & Games"},
        {date:"2025-10-23", type:"Income", category:"Bonus", amount:5000, note:"Performance Bonus"},
        {date:"2025-10-23", type:"Expense", category:"Bills", amount:2000, note:"Electricity + Internet"},
        {date:"2025-10-24", type:"Expense", category:"Shopping", amount:2500, note:"Clothes"},
        {date:"2025-10-25", type:"Income", category:"Investment", amount:4000, note:"Dividends"},
        {date:"2025-10-25", type:"Expense", category:"Health", amount:1000, note:"Medicines"}
    ];
    transactions.push(...sampleTransactions);

    updateAll();

    form.addEventListener("submit", function(e){
        e.preventDefault();
        const date = document.getElementById("date").value;
        const type = document.getElementById("type").value;
        const category = document.getElementById("category").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const note = document.getElementById("note").value;

        const tx = {date,type,category,amount,note};
        transactions.push(tx);
        updateAll();
        form.reset();
    });

    exportBtn.addEventListener("click", () => {
        const dataStr = JSON.stringify(transactions,null,2);
        const blob = new Blob([dataStr],{type:"application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.json";
        a.click();
    });

    function updateAll(){
        updateTable();
        updateDashboard();
        updateCharts();
        updateMonthlySummary();
        checkOverspending();
    }

    function updateTable(){
        tableBody.innerHTML = "";
        transactions.forEach(tx=>{
            const row = document.createElement("tr");
            row.classList.add("new");
            row.innerHTML = `<td>${tx.date}</td><td>${tx.type}</td><td>${tx.category}</td><td>${tx.amount.toFixed(2)}</td><td>${tx.note}</td>`;
            tableBody.appendChild(row);
        });
    }

    function updateDashboard(){
        const income = transactions.filter(t=>t.type==="Income").reduce((a,b)=>a+b.amount,0);
        const expense = transactions.filter(t=>t.type==="Expense").reduce((a,b)=>a+b.amount,0);
        totalIncomeEl.textContent = `₹${income.toFixed(2)}`;
        totalExpenseEl.textContent = `₹${expense.toFixed(2)}`;
        balanceEl.textContent = `₹${(income-expense).toFixed(2)}`;
    }

    function getRandomColor(){ return '#'+Math.floor(Math.random()*16777215).toString(16); }

    function updateCharts(){
        const expenseData={};
        transactions.filter(t=>t.type==="Expense").forEach(t=>expenseData[t.category]=(expenseData[t.category]||0)+t.amount);
        const pieLabels=Object.keys(expenseData), pieValues=Object.values(expenseData), pieColors=pieLabels.map(_=>getRandomColor());

        const dates=[...new Set(transactions.map(t=>t.date))].sort();
        const incomeData=dates.map(d=>transactions.filter(t=>t.date===d && t.type==="Income").reduce((a,b)=>a+b.amount,0));
        const expenseLine=dates.map(d=>transactions.filter(t=>t.date===d && t.type==="Expense").reduce((a,b)=>a+b.amount,0));

        if(pieChart) pieChart.destroy();
        pieChart=new Chart(document.getElementById("pieChart"),{
            type:"pie",
            data:{labels:pieLabels,datasets:[{data:pieValues,backgroundColor:pieColors}]},
            options:{responsive:true,plugins:{legend:{position:"top"}}}
        });

        if(lineChart) lineChart.destroy();
        lineChart=new Chart(document.getElementById("lineChart"),{
            type:"line",
            data:{labels:dates,datasets:[
                {label:"Income", data:incomeData, borderColor:"#4CAF50", fill:false, tension:0.3},
                {label:"Expense", data:expenseLine, borderColor:"#F44336", fill:false, tension:0.3}
            ]},
            options:{responsive:true,plugins:{legend:{position:"top"}}}
        });
    }

    function updateMonthlySummary(){
        const monthlyData={};
        transactions.forEach(t=>{
            const month=t.date.slice(0,7);
            if(!monthlyData[month]) monthlyData[month]={Income:0,Expense:0};
            monthlyData[month][t.type]+=t.amount;
        });
        const months=Object.keys(monthlyData).sort();
        const incomePerMonth=months.map(m=>monthlyData[m].Income);
        const expensePerMonth=months.map(m=>monthlyData[m].Expense);

        if(monthlyChart) monthlyChart.destroy();
        monthlyChart=new Chart(document.getElementById("monthlyChart"),{
            type:'bar',
            data:{labels:months,datasets:[
                {label:"Income",data:incomePerMonth,backgroundColor:"#4CAF50"},
                {label:"Expense",data:expensePerMonth,backgroundColor:"#F44336"}
            ]},
            options:{responsive:true,plugins:{legend:{position:"top"}}}
        });
    }

    function checkOverspending(){
        const monthlyCategory={};
        transactions.forEach(t=>{
            const month=t.date.slice(0,7);
            const key=`${month}-${t.category}`;
            monthlyCategory[key]=(monthlyCategory[key]||0)+t.amount;
        });
        for(const key in monthlyCategory){
            if(monthlyCategory[key]>overspendingThreshold && transactions.find(t=>t.category===key.split("-")[1] && t.type==="Expense")){
                const [month,category]=key.split("-");
                alert(`⚠️ Warning: You spent ₹${monthlyCategory[key]} on ${category} in ${month}, exceeding ₹${overspendingThreshold}!`);
            }
        }
    }
});