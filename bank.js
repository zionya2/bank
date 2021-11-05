
class Bank {
    #clients;
    idClient;

    constructor (clients) {
        this.#clients = clients;
        this.idClient = clients.length;
    }

    async getCurrencyRates() {
        let url = "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5";
        let json;
        let response = await fetch(url);
        let result = {};

        if (response.ok) {
            json = await response.json();
        }

        for (let i = 0; i < json.length; i++) {
            result[json[i]["ccy"]] = Number(json[i]["sale"]);
        }

        return result;
    }

    get getClients() {
        return this.#clients;
    }
    
    async calcTotalMoney(type) {
        let rates = await this.getCurrencyRates();
        let totalMoney = {};        

        for (let i = 0; i < this.#clients.length; i++) {

            for (let j = 0; j < this.#clients[i].accounts.length; j++) {
                let clientAccount = this.#clients[i].accounts[j];

                if (totalMoney[clientAccount.currency] === undefined) {
                    totalMoney[clientAccount.currency] = 0;
                }
                if (clientAccount.creditLimit) {
                    totalMoney[clientAccount.currency] += (clientAccount.balance - clientAccount.creditLimit);
                } else {
                    totalMoney[clientAccount.currency] += clientAccount.balance;
                }
            }
        }

        for (let elem in totalMoney) {
            
            if (elem !== type.toUpperCase()) {
                if (elem !== "UAH") {
                    totalMoney["UAH"] += totalMoney[elem] * rates[elem];
                }
            }
        }
        if(type.toUpperCase() === "UAH") {
            return totalMoney["UAH"];
        }
        return Math.floor((totalMoney["UAH"] / rates[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
    }

    async calcOweMoneyClients(type, isActive) {
        let rates = await this.getCurrencyRates();
        let totalMoney = {};

        for (let i = 0; i < this.#clients.length; i++) {

            for (let j = 0; j < this.#clients[i].accounts.length; j++) {
                let clientAccount = this.#clients[i].accounts[j];

                if (clientAccount.creditLimit && (clientAccount.creditLimit > clientAccount.balance)) {
                    if (totalMoney[clientAccount.currency] === undefined) {
                        totalMoney[clientAccount.currency] = 0;
                    }
                    if (isActive === undefined) {
                        totalMoney[clientAccount.currency] += (clientAccount.creditLimit - clientAccount.balance); 
                    }
                    if (this.#clients[i].isActive === isActive) {
                        totalMoney[clientAccount.currency] += (clientAccount.creditLimit - clientAccount.balance); 
                    }
                }
            }
        }
        for (let elem in totalMoney) {
            if (elem !== type.toUpperCase()) {
                if (elem !== "UAH") {
                    totalMoney["UAH"] += totalMoney[elem] * rates[elem];
                }
            }
        }
        if (type.toUpperCase() === "UAH") {
            return totalMoney["UAH"];
        }
        return Math.floor((totalMoney["UAH"] / rates[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
    }

    async countDebtorsTotalDebt(type, isActive){
        let rates = await this.getCurrencyRates();
        let result = { debtor: 0,};

        for (let i = 0; i < this.#clients.length; i++) {
            if (this.#clients[i].isActive === isActive) {

                for (let j = 0; j < this.#clients[i].accounts.length; j++) {
                    let clientAccount = this.#clients[i].accounts[j];

                    if (result[clientAccount.currency] === undefined) {
                            result[clientAccount.currency] = 0;
                    }
                    if (clientAccount.creditLimit && (clientAccount.creditLimit > clientAccount.balance)){
                        result.debtor++;
                        result[clientAccount.currency] += (clientAccount.creditLimit - clientAccount.balance);
                    }
                }
            }
        }
        for (let elem in result) {
            
            if (elem !== type.toUpperCase()) {
                if (elem !== "UAH" && elem !== "debtor") {

                    if (result["UAH"] === undefined) {
                        result["UAH"] = 0;
                    }
                    result["UAH"] += result[elem] * rates[elem];
                }
            }
        }
        if (type.toUpperCase() !== "UAH") {
            result[type.toUpperCase()] = Math.floor((result["UAH"] / rates[type.toUpperCase()] + result[type.toUpperCase()]) * 100) / 100;
        }
        return {"debtor": result["debtor"], [type.toUpperCase()]: result[type.toUpperCase()],};
    } 
}

class RenderHtml extends Bank {
    #app;

    constructor(clients, selector) {
        super(clients);
        this.#app = document.querySelector(selector);
        
        if(this.#app === null) {
            throw new Error("Selector not found");
        }
    }

    init() {
        this.#app.append(this.createElementByTypeAndValue("DIV", "", "modal"));
        this.#app.append(this.createElementByTypeAndValue("DIV", "", "menu"));
        this.#app.append(this.createElementByTypeAndValue("DIV", "", "container"));
        
        this.showMenu();
        this.showCards(this.getClients);
    }

    showCards(clients) {
        let container = document.querySelector(".container");
        container.innerHTML = "";

        for (let i = 0; i < clients.length; i++) {
           container.append(this.createCard(clients[i], false));
        }
    }

    modale(obj) {
        let container = document.body.querySelector(".modal");
        container.classList.add("modalVisible");
        container.append(this.createElementByTypeAndValue("DIV", "", "modalDialog"));
        container.firstElementChild.append(this.createCard(obj, true));
        container.addEventListener("click", onClickContainer);
    
        function onClickContainer(event) {
           // event.preventDefault();
            if (event.target.className === "modalDialog") {
                container.classList.remove("modalVisible");
                container.innerHTML = ""; 
            }
        }
    }

    showMenu() {
        let menu = document.body.querySelector(".menu");
        let buttonStatistics = this.createElementByTypeAndValue('button', "Статистика", "");
        let buttonNewClient = this.createElementByTypeAndValue('button', "Новый клиент", "");
        buttonNewClient.addEventListener("click", onClickNewClient.bind(this));
        buttonStatistics.addEventListener("click",  onClickStatistics.bind(this));
        menu.append(buttonStatistics);
        menu.append(buttonNewClient);
        
        function onClickNewClient(event) {
            event.preventDefault();
            this.modale({});
        }
        function onClickStatistics(event) {
            event.preventDefault();
            this.statistics();
        }
    }

    statistics() {
        let modale = document.body.querySelector(".modal");
        modale.classList.add("modalVisible");
        modale.append(this.createElementByTypeAndValue("DIV", "", "modalDialog"));
        modale.firstElementChild.append(this.createStatistics());
        modale.addEventListener("click", onClickContainer);

        function onClickContainer(event) {
            event.preventDefault();
            if (event.target.className === "modalDialog") {
                modale.classList.remove("modalVisible");
                modale.innerHTML = ""; 
            }
        }
    }

    createStatistics() {
        let statistics = this.createElementByTypeAndValue("DIV", "", "statistics");
        statistics.append(this.createElementByTypeAndValue("DIV", "Oбщее количество денег внутри банка в долларовом эквиваленте:", "statisticsTitle"));
        let totalMoneyDiv = this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(totalMoneyDiv);
        let totalMoney = this.calcTotalMoney("USD");
        totalMoney.then(data => totalMoneyDiv.innerText = data);
        statistics.append(this.createElementByTypeAndValue("DIV", "Количество денег в долларовом эквиваленте все клиенты должны банку:", "statisticsTitle"));
        let moneyDebtDiv =  this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(moneyDebtDiv);
        let moneyDebt = this.calcOweMoneyClients("USD");
        moneyDebt.then(data => moneyDebtDiv.innerText = data);
        statistics.append(this.createElementByTypeAndValue("DIV", "Cколько неактивных клиентов должны погасить кредит банку и на какую общую сумму:", "statisticsTitle"));
        let countDebtorActiveDiv = this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(countDebtorActiveDiv);
        let countDebtorActive = this.countDebtorsTotalDebt("USD", true);
        countDebtorActive.then(data => {
            return countDebtorActiveDiv.innerText = Object.keys(data)[0] + ": " + data[Object.keys(data)[0]]+"; " + Object.keys(data)[1] + ": " + data[Object.keys(data)[1]];
        });
        statistics.append(this.createElementByTypeAndValue("DIV", "Cколько активных клиентов должны погасить кредит банку и на какую общую сумму:", "statisticsTitle"));
        let countDebtorDiv = this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(countDebtorDiv);
        let countDebtor = this.countDebtorsTotalDebt("USD", false)
        countDebtor.then(data => {
            return countDebtorDiv.innerText = Object.keys(data)[0] + ": " + data[Object.keys(data)[0]]+"; " + Object.keys(data)[1] + ": " + data[Object.keys(data)[1]];
        });
        return statistics;
    }

    createElementByTypeAndValue(type, value, className, isEdit) {
        let div;
        if (isEdit === undefined) {
            div = document.createElement(type);
            div.className = className;
            div.innerText = value;
            return div;
        }
        if (isEdit) {
            div = document.createElement("INPUT");
            div.className = className;
            div.required = true;
            if (value === 0) {
                div.value = value;
            } else {
               div.value = value || ""; 
            }
            if (type === "date") {
                div.type = "date";
                if (value === undefined) {
                    div.valueAsDate = new Date();
                }
            }
        } else {
            div = document.createElement(type);
            div.className = "valueTitle";
            if (value === 0) {
                div.innerText = value;
            } else {
                div.innerText = value || ""; 
            }
        }
        return div;
    }

    createSelectByValueAndData(value, data, className, isEdit) {
        
        if (!Array.isArray(data)) {
            data = [];
        }
        if (!isEdit) {
            let div = document.createElement("DIV");
            div.className = "valueTitle";
            div.innerText = value || 0;
            //div.innerText = data[value] || 0;
            return div;
        }
        let select = document.createElement('SELECT');
        select.required = true;
        select.className = className || "";
        if (value === undefined) {
            let option = document.createElement('OPTION');
            option.value = "";
            select.append(option);
        }
        for (let i = 0; i < data.length; i++) {
            let option = document.createElement('OPTION');
            option.value = i;
            option.textContent = data[i];
            if (i === value) {
                option.setAttribute("selected", true);
            }
            select.append(option);
        }
        return select;
    }
    createAccount(account, isEdit){
        let typeAccount = ["debit", "credit"];
        //console.log("account", account);
        let accountClient = this.createElementByTypeAndValue("DIV", "", "accountClient");
        accountClient.append(this.createElementByTypeAndValue("DIV", "Тип счета", "nameTitle"))
        accountClient.append(this.createSelectByValueAndData(account.type, typeAccount, "selectClientStatus", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Валюта", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("DIV", account.currency, "inputCurrency", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Баланс", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("DIV", account.balance, "inputCurrency", isEdit));

        if (account.creditLimit !== undefined) {
            accountClient.append(this.createElementByTypeAndValue("DIV", "Кредитный лимит", "nameTitle"));
            accountClient.append(this.createElementByTypeAndValue("DIV", account.creditLimit, "inputCurrency", isEdit));
        }
        accountClient.append(this.createElementByTypeAndValue("DIV", "Статус счета", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("DIV", String(account.isActive), "inputCurrency", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Дата регистрации", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("date", account["registrationDate"], "registrationDate", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Дата регистрации", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("date", account["expirationDate"], "registrationDate", isEdit));

        return accountClient;
    }
    createCard(obj, isEdit) {
        const clientStatus =  ["Заблокирован", "Активный"];
        let card = this.createElementByTypeAndValue("DIV", "", 'card');
        card.id = obj.id;
        let cardTitle = this.createElementByTypeAndValue("H2", "Карточка клиента", "cardTitle");
        card.append(cardTitle);
        let cardBody = this.createElementByTypeAndValue("DIV", "", "cardBody");
        card.append(cardBody);
        cardBody.append(this.createElementByTypeAndValue("DIV", "Имя", "nameTitle"));
        cardBody.append(this.createElementByTypeAndValue("DIV", obj["name"], "inputName", isEdit));
        cardBody.append(this.createElementByTypeAndValue("DIV", "Фамилия", "nameTitle"));
        cardBody.append(this.createElementByTypeAndValue("DIV", obj["surname"], "inputSurname", isEdit));
        cardBody.append(this.createElementByTypeAndValue("DIV", "Статус клиента", "nameTitle"));
        cardBody.append(this.createSelectByValueAndData(String(obj.isActive), clientStatus, "selectClientStatus", isEdit));
        cardBody.append(this.createElementByTypeAndValue("DIV", "Дата регистрации", "nameTitle"));
        cardBody.append(this.createElementByTypeAndValue("date", obj["registrationDate"], "registrationDate", isEdit));
        cardBody.append(this.createElementByTypeAndValue("DIV", "Счета клиента", "nameTitle"));
        let accountsClient = this.createElementByTypeAndValue("div", "", "accounts");
        cardBody.append(accountsClient);
        let accountLength = 0;
        if (obj.accounts !== undefined) {
            accountLength = obj.accounts.length;
        }
        for (let i = 0; i < accountLength; i++) {
            accountsClient.append(this.createAccount(obj.accounts[i], isEdit));
        }
        

        /*cardBody.append(this.createSelectByValueAndData(obj.departmentNumber, this.departments, "selectDepartment", isEdit));
         cardBody.append(this.createElementByTypeAndValue("div", "Должность", "nameTitle"));
        cardBody.append(this.createSelectByValueAndData(obj.position, this.positions, "selectPosition", isEdit)); 
        cardBody.append(this.createElementByTypeAndValue("div", "Зарплата", "nameTitle"));
        cardBody.append(this.createElementByTypeAndValue("div", obj["salary"], "inputSalary", isEdit));
        cardBody.append(this.createElementByTypeAndValue("div", "Статус", "nameTitle"));
        cardBody.append(this.createSelectByValueAndData(Number(!obj.isFired), workStatus, "selectWorkStatus", isEdit));
*/
        let button;
        if (obj.id === undefined) {
            button = this.createElementByTypeAndValue("button", "Создать", "button");
            //button.addEventListener("click", this.onClickCreate.bind(this));
        } else {
            if (isEdit) {
                button = this.createElementByTypeAndValue("button", "Сохранить", "button");
               // button.addEventListener("click", this.onClickSave.bind(this));
            } else {
                button = this.createElementByTypeAndValue("button", "Изменить", "button");
               // button.addEventListener("click", this.onClickChange.bind(this));
            }
        }
        cardBody.append(button);
        if (!isEdit) {
            let buttonDelete = this.createElementByTypeAndValue("button", "Удалить", "button");
            cardBody.append(buttonDelete);
           // buttonDelete.addEventListener("click", this.onClickDelete.bind(this));
        }
       
        return card;
    }
}

let baseClients = [
    {
        id: 0,
        name: "John",
        surname: "Conor",
        isActive: true,
        registrationDate: "2014-02-01",
        accounts: [{
            type: "debit",
            currency: "USD",
            balance: 500,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2023-02-01",
        },
        {
            type: "credit",
            currency: "UAH",
            balance: 100,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        },],
    },
    {
        id: 1,
        name: "Jacob",
        surname: "Onor",
        isActive: true,
        registrationDate: "2014-02-01",
        accounts: [{
            type: "debit",
            currency: "UAH",
            balance: 1200,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2022-02-01",
        },
        {
            type: "credit",
            currency: "USD",
            balance: 200,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        },], 
    },
    {
        id: 2,
        name: "Eva",
        surname: "Onor",
        isActive: false,
        registrationDate: "2014-02-01",
        accounts: [{
            type: "debit",
            currency: "EUR",
            balance: 1200,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2024-02-12",
        },
        {
            type: "credit",
            currency: "USD",
            balance: 100,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        },], 
    },
    {
        id: 3,
        name: "William",
        surname: "Onor",
        isActive: true,
        registrationDate: "2014-02-01",
        accounts: [{
            type: "debit",
            currency: "USD",
            balance: 750,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2025-02-01",
        },
        {
            type: "credit",
            currency: "EUR",
            balance: 100,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        },], 
    },
];

document.addEventListener("DOMContentLoaded", function() {
    let render = new RenderHtml(baseClients, ".app");
    render.init();
});
