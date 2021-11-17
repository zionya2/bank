
type typeClients = Array<{
    id: number,
    name: string,
    surname: string,
    isActive: boolean,
    registrationDate: string,
    accounts?: Array<object>,
}>;

class Bank {
    private clients:typeClients;
    public idClient:number;
    private currencyTypes:Array<string>;
    constructor (clients:typeClients){
        this.clients = clients;
    }

    async getCurrencyRates():Promise<object>{
        let url:string = "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5";
        let json:Array<object>;
        let response = await fetch(url);
        let result:object = {};

        if (response.ok) {
            json = await response.json();
        }

        for (let i:number = 0; i < json.length; i++) {
            result[json[i]["ccy"]] = Number(json[i]["sale"]);
        }

        return result;
    }

    get getClients():typeClients {
        return this.clients;
    }

    async calcMoney(type:string):Promise<number> {

        let rates:object = await this.getCurrencyRates();
        let totalMoney:Record<string, number> = {"UAH": 0, [type.toUpperCase()]: 0,};        

        for (let i:number = 0; i < this.clients.length; i++) {

            for (let j:number = 0; j < this.clients[i].accounts.length; j++) {
                let clientAccount:object = this.clients[i].accounts[j];

                if (totalMoney[this.currencyTypes[clientAccount["currency"]]] === undefined) {
                    totalMoney[this.currencyTypes[clientAccount["currency"]]] = 0;
                }
                if (clientAccount["creditLimit"]) {
                    totalMoney[this.currencyTypes[clientAccount["currency"]]] += (clientAccount["balance"] - clientAccount["creditLimit"]);
                } else {
                    totalMoney[this.currencyTypes[clientAccount["currency"]]] += clientAccount["balance"];
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
        if (totalMoney[type.toUpperCase()] === undefined) {
            totalMoney[type.toUpperCase()] = 0;
        }
        return Math.floor((totalMoney["UAH"] / rates[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
    }

    async calcOweMoneyClients(type:string, isActive?:boolean):Promise<number> {
        let rates:object = await this.getCurrencyRates();
        let totalMoney:Record<string, number> = {"UAH": 0, [type.toUpperCase()]: 0,};

        for (let i:number = 0; i < this.clients.length; i++) {

            for (let j:number = 0; j < this.clients[i].accounts.length; j++) {
                let clientAccount:object = this.clients[i].accounts[j];

                if (clientAccount["creditLimit"] && (clientAccount["creditLimit"] > clientAccount["balance"])) {
                    if (totalMoney[this.currencyTypes[clientAccount["currency"]]] === undefined) {
                        totalMoney[this.currencyTypes[clientAccount["currency"]]] = 0;
                    }
                    if (isActive === undefined) {
                        totalMoney[this.currencyTypes[clientAccount["currency"]]] += (clientAccount["creditLimit"] - clientAccount["balance"]); 
                    }
                    if (this.clients[i].isActive === isActive) {
                        totalMoney[this.currencyTypes[clientAccount["currency"]]] += (clientAccount["creditLimit"] - clientAccount["balance"]); 
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

    async countDebtorsTotalDebt(type:string, isActive:boolean):Promise<object> {
        let rates:object = await this.getCurrencyRates();
        let result:Record<string, number> = { debtor: 0, [type.toUpperCase()]: 0, "UAH": 0,};

        for (let i:number = 0; i < this.clients.length; i++) {
            if (this.clients[i].isActive === isActive) {

                for (let j = 0; j < this.clients[i].accounts.length; j++) {
                    let clientAccount:object = this.clients[i].accounts[j];

                    if (result[this.currencyTypes[clientAccount["currency"]]] === undefined) {
                            result[this.currencyTypes[clientAccount["currency"]]] = 0;
                    }
                    if (clientAccount["creditLimit"] && (clientAccount["creditLimit"] > clientAccount["balance"])){
                        result.debtor++;
                        result[this.currencyTypes[clientAccount["currency"]]] += (clientAccount["creditLimit"] - clientAccount["balance"]);
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

class RenderHtml {
    private app:Element;
    private clients:typeClients;
    private clientStatus:Array<string>;
    private bank:Bank;

    constructor(clients:typeClients, selector:string) {

        this.bank = new Bank(clients);
        this.clients = this.bank.getClients;
        this.app = document.querySelector(selector);
        this.clientStatus = ["Заблокирован", "Активный"];
        
        if(this.app === null) {
            throw new Error("Selector not found");
        }
    }

    init() {
        this.app.append(this.createElementByTypeAndValue("DIV", "", "modal"));
        this.app.append(this.createElementByTypeAndValue("DIV", "", "menu"));
        this.app.append(this.createElementByTypeAndValue("DIV", "", "container"));
        this.showMenu();
        this.showCards(this.clients);
    }

    showCards(clients:Array<object>) {
        let container:Element = document.querySelector(".container");
        container.innerHTML = "";

        for (let i:number = 0; i < clients.length; i++) {
           container.append(this.createCard(clients[i], false));
        }
    }

    modale(obj:object) {
        let container:HTMLElement = document.body.querySelector(".modal");
        container.innerHTML = "";
        container.classList.add("modalVisible");
        container.append(this.createElementByTypeAndValue("DIV", "", "modalDialog"));
        container.firstElementChild.append(this.createCard(obj, true));
        container.addEventListener("click", onClickContainer);
    
        function onClickContainer(event:MouseEvent) {
           // event.preventDefault();
            if (event.target["className"] === "modalDialog") {
                container.classList.remove("modalVisible");
                container.innerHTML = ""; 
            }
        }
    }

    showMenu() {
        let menu:Element = document.body.querySelector(".menu");
        let buttonStatistics:HTMLElement = this.createElementByTypeAndValue('button', "Статистика", "");
        let buttonNewClient:HTMLElement = this.createElementByTypeAndValue('button', "Новый клиент", "");
        buttonNewClient.addEventListener("click", onClickNewClient.bind(this));
        buttonStatistics.addEventListener("click",  onClickStatistics.bind(this));
        menu.append(buttonStatistics);
        menu.append(buttonNewClient);
        
        function onClickNewClient(event:MouseEvent) {
            event.preventDefault();
            this.modale({});
        }
        function onClickStatistics(event:MouseEvent) {
            event.preventDefault();
            this.statistics();
        }
    }

    statistics() {
        let modale:HTMLElement = document.body.querySelector(".modal");
        modale.classList.add("modalVisible");
        modale.append(this.createElementByTypeAndValue("DIV", "", "modalDialog"));
        modale.firstElementChild.append(this.createStatistics());
        modale.addEventListener("click", onClickContainer);

        function onClickContainer(event:MouseEvent) {
            event.preventDefault();
            if (event.target["className"] === "modalDialog") {
                modale.classList.remove("modalVisible");
                modale.innerHTML = ""; 
            }
        }
    }

    createStatistics():HTMLElement {
        let statistics:HTMLElement = this.createElementByTypeAndValue("DIV", "", "statistics");
        statistics.append(this.createElementByTypeAndValue("DIV", "Oбщее количество денег внутри банка в долларовом эквиваленте:", "statisticsTitle"));
        let totalMoneyDiv:HTMLElement = this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(totalMoneyDiv);
        let totalMoney = this.bank.calcMoney("USD");
        totalMoney.then(data => totalMoneyDiv["innerText"] = String(data));
        statistics.append(this.createElementByTypeAndValue("DIV", "Количество денег в долларовом эквиваленте все клиенты должны банку:", "statisticsTitle"));
        let moneyDebtDiv:HTMLElement =  this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(moneyDebtDiv);
        let moneyDebt = this.bank.calcOweMoneyClients("USD");
        moneyDebt.then(data => moneyDebtDiv["innerText"] = String(data));
        statistics.append(this.createElementByTypeAndValue("DIV", "Cколько активных клиентов должны погасить кредит банку и на какую общую сумму:", "statisticsTitle"));
        let countDebtorActiveDiv:HTMLElement = this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(countDebtorActiveDiv);
        let countDebtorActive = this.bank.countDebtorsTotalDebt("USD", true);
        countDebtorActive.then(data => {
            return countDebtorActiveDiv.innerText = Object.keys(data)[0] + ": " + data[Object.keys(data)[0]]+"; " + Object.keys(data)[1] + ": " + data[Object.keys(data)[1]];
        });
        statistics.append(this.createElementByTypeAndValue("DIV", "Cколько неактивных клиентов должны погасить кредит банку и на какую общую сумму:", "statisticsTitle"));
        let countDebtorDiv:HTMLElement = this.createElementByTypeAndValue("DIV", "Loading...", "statisticsValue");
        statistics.append(countDebtorDiv);
        let countDebtor = this.bank.countDebtorsTotalDebt("USD", false);
        countDebtor.then(data => {
            return countDebtorDiv.innerText = Object.keys(data)[0] + ": " + data[Object.keys(data)[0]]+"; " + Object.keys(data)[1] + ": " + data[Object.keys(data)[1]];
        });
        return statistics;
    }

    createElementByTypeAndValue(type:string, value:number|string, className:string, isEdit?:boolean):HTMLElement {
        let div:HTMLElement;
        if (isEdit === undefined) {
            div = document.createElement(type);
            div.className = className;
            div["innerText"] = String(value);
            return div;
        }
        if (isEdit) {
            div = document.createElement("INPUT");
            div.className = className;
            div["required"] = true;
            if (value === 0) {
                div["value"] = value;
            } else {
               div["value"] = value || ""; 
            }
            if (type === "date") {
                div["type"] = "date";
                if (value === undefined) {
                    div["valueAsDate"] = new Date();
                }
            }
        } else {
            div = document.createElement("DIV");
            div.className = "valueTitle";
            if (value === 0) {
                div["innerText"] = String(value);
            } else {
                div["innerText"] = String(value) || ""; 
            }
        }
        return div;
    }

    createSelectByValueAndData(value:number, data:Array<number|string>, className:string, isEdit:boolean):HTMLElement {
        
        if (!Array.isArray(data)) {
            data = [];
        }
        if (!isEdit) {
            let div:HTMLElement = document.createElement("DIV");
            div.className = "valueTitle";
            div.innerText = String(data[value] || 0);
            return div;
        }
        let select:HTMLElement= document.createElement('SELECT');
        select["required"] = true;
        select.className = className || "";
        if (value === undefined) {
            let option:HTMLElement = document.createElement('OPTION');
            option["value"] = "";
            select.append(option);
        }
        for (let i:number = 0; i < data.length; i++) {
            let option:HTMLElement = document.createElement('OPTION');
            option["value"] = i;
            option.textContent = String(data[i]);
            if (i === value) {
                option.setAttribute("selected", "true");
            }
            select.append(option);
        }
        return select;
    }

    createAccountHtml(account:object, isEdit:boolean):HTMLElement{
        let typeAccount = ["debit", "credit"];
        let accountClient = this.createElementByTypeAndValue("DIV", "", "accountClient");
        accountClient.append(this.createElementByTypeAndValue("DIV", "Тип счета", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("DIV", typeAccount[account["type"]], "valueTitle"));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Дата регистрации", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("date", account["registrationDate"], "registrationDate", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Дата окончания", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("date", account["expirationDate"], "expirationDate", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Валюта", "nameTitle"));
        accountClient.append(this.createSelectByValueAndData(account["currency"], this["currencyTypes"], "selectCurrency", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Статус счета", "nameTitle"));
        accountClient.append(this.createSelectByValueAndData(Number(account["isActive"]), this.clientStatus, "selectStatus", isEdit));
        accountClient.append(this.createElementByTypeAndValue("DIV", "Баланс", "nameTitle"));
        accountClient.append(this.createElementByTypeAndValue("DIV", account["balance"], "inputBalance", isEdit));
        if (account["creditLimit"] !== undefined) {
            accountClient.append(this.createElementByTypeAndValue("DIV", "Кредитный лимит", "nameTitle"));
            accountClient.append(this.createElementByTypeAndValue("DIV", account["creditLimit"], "inputLimit", isEdit));
        }
        if (isEdit) {
            let button:HTMLElement = this.createElementByTypeAndValue("button", "Удалить счет", "button");
            button["typeAction"] = "remove";
            button.addEventListener("click", this.onClickAccount.bind(this));
            accountClient.append(button);
        }
        return accountClient;
    }

    createCard(obj:object, isEdit:boolean):HTMLElement {
        
        let card:HTMLElement = this.createElementByTypeAndValue("DIV", "", 'card');
        let cardTitle:HTMLElement = this.createElementByTypeAndValue("H2", "Карточка клиента", "cardTitle");
        card.append(cardTitle);
        let cardBody:HTMLElement = this.createElementByTypeAndValue("DIV", "", "cardBody");
        card.append(cardBody);
        let infoClient:HTMLElement = this.createElementByTypeAndValue("DIV", "", "infoClient");
        infoClient.id = obj["id"];
        cardBody.append(infoClient);
        infoClient.append(this.createElementByTypeAndValue("DIV", "Имя", "nameTitle"));
        infoClient.append(this.createElementByTypeAndValue("DIV", obj["name"], "inputName", isEdit));
        infoClient.append(this.createElementByTypeAndValue("DIV", "Фамилия", "nameTitle"));
        infoClient.append(this.createElementByTypeAndValue("DIV", obj["surname"], "inputSurname", isEdit));
        infoClient.append(this.createElementByTypeAndValue("DIV", "Статус клиента", "nameTitle"));
        infoClient.append(this.createSelectByValueAndData(Number(obj["isActive"]), this.clientStatus, "selectClientStatus", isEdit));
        infoClient.append(this.createElementByTypeAndValue("DIV", "Дата регистрации", "nameTitle"));
        infoClient.append(this.createElementByTypeAndValue("date", obj["registrationDate"], "registrationDate", isEdit));
        let accounts:Array<object>;
        if (obj["accounts"] !== undefined) {
            accounts = obj["accounts"];
        }
        for (let i:number = 0; i < accounts.length; i++) {
            let account:HTMLElement = this.createAccountHtml(accounts[i], isEdit);
            account.id = String(i);
            cardBody.append(account);
        }

        let button:HTMLElement;
        let buttonNewAccount:HTMLElement;
        if (obj["id"] === undefined) {
            button = this.createElementByTypeAndValue("button", "Создать", "button");
            button.addEventListener("click", this.onClickCreate.bind(this));
        } else {
            if (isEdit) {
                button = this.createElementByTypeAndValue("button", "Сохранить", "button");
                buttonNewAccount = this.createElementByTypeAndValue("button", "Добавить счет", "button");
                buttonNewAccount["typeAction"] = "new";
                buttonNewAccount.addEventListener("click", this.onClickAccount.bind(this));
                infoClient.append(buttonNewAccount);
                button.addEventListener("click", this.onClickSave.bind(this));
            } else {
                button = this.createElementByTypeAndValue("button", "Изменить", "button");
                button.addEventListener("click", this.onClickChange.bind(this));
            }
        }
        infoClient.append(button);
        if (!isEdit) {
            let buttonDelete:HTMLElement = this.createElementByTypeAndValue("button", "Удалить", "button");
            infoClient.append(buttonDelete);
            buttonDelete.addEventListener("click", this.onClickDelete.bind(this));
        }
        return card;
    }

    onClickSave(event:MouseEvent) {
        event.preventDefault();
        let id:number;
        let container:Element = document.body.querySelector(".modal");
        let card:Element = container.querySelector(".infoClient");
    
        for (let i:number = 0; i < this.clients.length; i++) {
            if (this.clients[i]["id"] === Number(card.id)) {
                id = i;
                break;
            }
        }
        this.clients[id].name = card.querySelector(".inputName")["value"];
        this.clients[id].surname = card.querySelector(".inputSurname")["value"];
        this.clients[id].isActive = Boolean(card.querySelector(".selectClientStatus")["options"].selectedIndex);
        this.clients[id].registrationDate = card.querySelector(".registrationDate")["value"];
        let accountsDom:NodeListOf<Element> = container.querySelectorAll(".accountClient");

        for (let i:number = 0; i < accountsDom.length; i++) {
            this.clients[id].accounts[i]["registrationDate"] = accountsDom[i].querySelector(".registrationDate")["value"];
            this.clients[id].accounts[i]["expirationDate"] = accountsDom[i].querySelector(".expirationDate")["value"];
            this.clients[id].accounts[i]["currency"] = accountsDom[i].querySelector(".selectCurrency")["options"].selectedIndex;
            let accountStatus = accountsDom[i].querySelector(".selectStatus")["options"].selectedIndex;
            this.clients[id].accounts[i]["isActive"] = Boolean(accountStatus);
            this.clients[id].accounts[i]["balance"] = Number(accountsDom[i].querySelector(".inputBalance")["value"]);
            let accountCreditLimit:string;
            if (accountsDom[i].querySelector(".inputLimit") !== null) {
                accountCreditLimit = accountsDom[i].querySelector(".inputLimit")["value"];
                 if (accountCreditLimit === "0" || accountCreditLimit === ""){
                    this.clients[id].accounts[i]["type"] = 0;
                    delete this.clients[id].accounts[i]["creditLimit"];
                } else {
                    this.clients[id].accounts[i]["type"] = 1;
                    this.clients[id].accounts[i]["creditLimit"] = Number(accountCreditLimit);
                }
            } else {
                this.clients[id].accounts[i]["type"] = 0;
            }
        }
        container.classList.remove("modalVisible");
        container.innerHTML = "";
        this.showCards(this.clients);
    }

    onClickAccount(event:MouseEvent) {
        let container:Element = document.body.querySelector(".modal");
        let idAccount:number = Number(event.target["parentElement"].id);
        let idCard:number = Number(container.querySelector(".infoClient").id);
        for (let i:number = 0; i < this.clients.length; i++) {
            if (this.clients[i]["id"] === idCard) {
                if(event.target["typeAction"] === "new") {
                    let newAccount:object = {
                        type: 1,
                        currency: 0,
                        balance: 0,
                        creditLimit: 0,
                        isActive: true,
                        registrationDate: 0,
                        expirationDate: 0,
                    };
                    this.clients[i].accounts.push(newAccount);
                } else {
                    this.clients[i].accounts.splice(idAccount, 1);
                }
                this.modale(this.clients[i]);
                break;
            }
        }
    }

    onClickCreate(event:MouseEvent) {
        event.preventDefault();
        let container = document.body.querySelector(".modal");
        let infoClient = container.querySelector(".infoClient");
        let inValid = true;
        let newClient;
        newClient["name"] = infoClient.querySelector(".inputName")["value"];
        newClient["surname"] = infoClient.querySelector(".inputSurname")["value"];
        newClient["isActive"] = Boolean(infoClient.querySelector(".selectClientStatus")["options"].selectedIndex);
        newClient["registrationDate"] = infoClient.querySelector(".registrationDate")["value"];
        newClient["accounts"] = [];
        for (let prop in newClient) {
            if (newClient[prop] === '') {
                    inValid = false;
            }
        }
        if (inValid && newClient["isActive"]) {
            newClient["id"] = ++this.bank.idClient;
            this.clients.push(newClient);
            container.classList.remove("modalVisible");
            container.innerHTML = "";
            this.showCards(this.clients);
        }
    }

    onClickChange(event:MouseEvent) {
        event.preventDefault();
        let id:number = Number(event.target["parentElement"].id);
        for (let i:number = 0; i < this.clients.length; i++) {
            if (this.clients[i]["id"] === id) {
                this.modale(this.clients[i]);
                break;
            }
        }
    }

    onClickDelete(event:MouseEvent) {
        event.preventDefault();
        let id:number = Number(event.target["parentElement"].id);
        for (let i:number = 0; i < this.clients.length; i++) {
            if (this.clients[i]["id"] === id) {
                this.clients.splice(i, 1);
                break;
            }
        }
        this.showCards(this.bank.getClients);
    }

}

let baseClients:typeClients = [
    {
        id: 0,
        name: "John",
        surname: "Conor",
        isActive: true,
        registrationDate: "2013-02-01",
        accounts: [{
            type: 0,
            currency: 1,
            balance: 500,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2023-02-01",
        },
        {
            type: 1,
            currency: 0,
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
            type: 0,
            currency: 0,
            balance: 1200,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2022-02-01",
        },
        {
            type: 1,
            currency: 1,
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
        registrationDate: "2015-02-01",
        accounts: [{
            type: 0,
            currency: 2,
            balance: 1200,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2024-02-12",
        },
        {
            type: 1,
            currency: 1,
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
        registrationDate: "2016-02-01",
        accounts: [{
            type: 0,
            currency: 1,
            balance: 750,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2025-02-01",
        },
        {
            type: 1,
            currency: 2,
            balance: 100,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        },], 
    },
];

document.addEventListener("DOMContentLoaded", function() {
    let render:RenderHtml = new RenderHtml(baseClients, ".app");
    render.init();
});