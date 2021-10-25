/*
Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета.
Существует два типа счетов: дебетовый и кредитовый.

Дебитовый счет имеет текущий баланс либо он положителен либо нулевой.
Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит.
У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты.
У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие.

Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств.
Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку.
Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму.
Аналогично для активных.

Для получения актуальных курсов валют использовать API (которое будет предоставлено).
Промисы использовать для работы с API в целях отправки запросов на сервер.

Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.
debit
*/
/*
accounts
Debit account
Credit account 
current balance
type
expiration date

Jacob
William
Ethan
Michael

A debit account has a current balance that is either positive or zero.
A credit account has two balances: personal funds, credit funds and credit limit. 

Each account has an activity, the date of activity when the expiration date of the plastic card expires.
Each account has a currency type, UAH, RUB, USD, GBP, EUR and others.
*/

let baseClients = [
    {
        name: "John",
        surname: "Conor",
        isActive: true,
        registrationDate: "2014-02-01",
        debitAccount: {
            type: "USD",
            balance: 500,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2023-02-01",
        },
        creditAccaunt: {
            type: "UAH",
            balance: 0,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        }, 
    },
    {
        name: "Jacob",
        surname: "Onor",
        isActive: true,
        registrationDate: "2014-02-01",
        debitAccount: {
            type: "UAH",
            balance: 1200,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2022-02-01",
        },
        creditAccaunt: {
            type: "USD",
            balance: 200,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        }, 
    },
    {
        name: "Eva",
        surname: "Onor",
        isActive: false,
        registrationDate: "2014-02-01",
        debitAccount: {
            type: "EUR",
            balance: 1200,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2024-02-12",
        },
        creditAccaunt: {
            type: "USD",
            balance: 100,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        }, 
    },
    {
        name: "William",
        surname: "Onor",
        isActive: true,
        registrationDate: "2014-02-01",
        debitAccount: {
            type: "USD",
            balance: 750,
            isActive: true,
            registrationDate: "2019-02-01",
            expirationDate: "2025-02-01",
        },
        creditAccaunt: {
            type: "EUR",
            balance: 300,
            creditLimit: 300,
            isActive: true,
            registrationDate: "2020-02-01",
            expirationDate: "2024-02-01",
        }, 
    },
];

class Bank {
    #clients;

    constructor (clients){
        this.#clients = clients;
    }

    /*async getCurrencyRates(){
        let url = "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5";
        let json;
        let response = await fetch(url);
        let result = {};

        if (response.ok) {
            json = await response.json();
        }

        for (let i = 0; i < json.length; i++){
            result[json[i]["ccy"]] = Number(json[i]["sale"]);
        }

        return result;
    }*/

    getCurrencyRates(){
        let url = "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5";
        //let json;
        //let response = await fetch(url);
        //let result = {};

        let result = fetch(url)
            .then((result) => result.json())
            .then((obj) => {
                    let result = {};
                    for (let i = 0; i < obj.length; i++){
                        result[obj[i]["ccy"]] = Number(obj[i]["sale"]);
                    }
                    return result;
                }
            );
        return result;
    }

    countTotalMoneyInsideBank(type) {
        let rates = this.getCurrencyRates();
        //rates
        console.log(rates.USD, "rates", rates, rates["USD"]);
        let totalMoney = {};        

        for (let i = 0; i < this.#clients.length; i++) {

            if (totalMoney[this.#clients[i].debitAccount.type] === undefined || totalMoney[this.#clients[i].creditAccaunt.type] === undefined) {
                totalMoney[this.#clients[i].debitAccount.type] = 0;
                totalMoney[this.#clients[i].creditAccaunt.type] = 0;
            };
            totalMoney[this.#clients[i].debitAccount.type] += this.#clients[i].debitAccount.balance;
            totalMoney[this.#clients[i].creditAccaunt.type] += (this.#clients[i].creditAccaunt.balance - this.#clients[i].creditAccaunt.creditLimit);
        }
        console.log("totalManey", totalMoney)        
        for (let elem in totalMoney) {
            if (elem !== type.toUpperCase()) {
                if (elem !== "UAH") {
                    console.log("rates[elem]", rates["USD"], elem)
                    totalMoney["UAH"] += totalMoney[elem] * rates[elem];
                }
            }
        }
        
        console.log("totalManeypo", totalMoney);

        return Math.floor((totalMoney["UAH"] / rates[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
    }

    async countOweMoneyAllClients(type) {
        let rates = await this.getCurrencyRates();
        let totalMoney = {};

        for (let i = 0; i < this.#clients.length; i++) {

            if (totalMoney[this.#clients[i].creditAccaunt.type] === undefined) {
                totalMoney[this.#clients[i].creditAccaunt.type] = 0;
            }
            totalMoney[this.#clients[i].creditAccaunt.type] += (this.#clients[i].creditAccaunt.creditLimit - this.#clients[i].creditAccaunt.balance);
        }
        
        for (let elem in totalMoney) {
            if (elem !== type.toUpperCase()) {
                if (elem !== "UAH") {
                    totalMoney["UAH"] += totalMoney[elem] * rates[elem];
                }
            }
        }
        return Math.floor((totalMoney["UAH"] / rates[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
    }

    countDebtorsTotalDebt(isActive){
        let result = { debtor: 0,};

        for (let i = 0; i < this.#clients.length; i++) {

            if (this.#clients[i].isActive === isActive) {
                
                if (this.#clients[i].creditAccaunt.creditLimit !== this.#clients[i].creditAccaunt.balance){
                    result.debtor++;
                    
                    if (result[this.#clients[i].creditAccaunt.type] === undefined) {
                        result[this.#clients[i].creditAccaunt.type] = 0;
                    };
                    result[this.#clients[i].creditAccaunt.type] += (this.#clients[i].creditAccaunt.creditLimit - this.#clients[i].creditAccaunt.balance);
                }    
            }
        }
        return result;
    } 

}

let bank = new Bank(baseClients);

console.log("rt", bank.countTotalMoneyInsideBank("EUR"));
//console.log("rt", bank.countOweMoneyAllClients("USD"));
//console.log("rt", bank.countDebtorsTotalDebt(true));
