
class Bank {
    #clients;

    constructor (clients){
        this.#clients = clients;
    }

    async getCurrencyRates(){
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
    }

    countTotalMoney(type) {
        let rates = this.getCurrencyRates();
        rates.then(data => {
            let totalMoney = {};        

            for (let i = 0; i < this.#clients.length; i++) {

                if (totalMoney[this.#clients[i].debitAccount.type] === undefined || totalMoney[this.#clients[i].creditAccaunt.type] === undefined) {
                    totalMoney[this.#clients[i].debitAccount.type] = 0;
                    totalMoney[this.#clients[i].creditAccaunt.type] = 0;
                };
                totalMoney[this.#clients[i].debitAccount.type] += this.#clients[i].debitAccount.balance;
                totalMoney[this.#clients[i].creditAccaunt.type] += (this.#clients[i].creditAccaunt.balance - this.#clients[i].creditAccaunt.creditLimit);
            }

            for (let elem in totalMoney) {
                
                if (elem !== type.toUpperCase()) {
                    if (elem !== "UAH") {
                        console.log("rates[elem]", data["USD"], elem)
                        totalMoney["UAH"] += totalMoney[elem] * data[elem];
                    }
                }
            }
            
            return Math.floor((totalMoney["UAH"] / data[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
        });
    }

    countOweMoneyAllClients(type) {
        let rates = this.getCurrencyRates();

        rates.then(data => {
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
                        totalMoney["UAH"] += totalMoney[elem] * data[elem];
                    }
                }
            }
            return Math.floor((totalMoney["UAH"] / data[type.toUpperCase()] + totalMoney[type.toUpperCase()]) * 100) / 100;
        });
        
    }

    countDebtorsTotalDebt(isActive, type){
        let rates = this.getCurrencyRates();

        rates.then(data => {
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
            
            for (let elem in result) {
                if (elem !== type.toUpperCase()) {
                    if (elem !== "UAH" && elem !== "debtor") {
                        result["UAH"] += result[elem] * data[elem];
                    }
                }
            }
            result[type] = Math.floor((result["UAH"] / data[type.toUpperCase()] + result[type.toUpperCase()]) * 100) / 100;
            console.log({"debtor": result["debtor"], [type]: result[type],})
            return {"debtor": result["debtor"], [type]: result[type],};
        });
        
    } 

}

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

let bank = new Bank(baseClients);

/*let bankIb = bank.getCurrencyRates()

bankIb.then(data => {
    console.log(data.EUR)
})*/

//console.log(typeof bank.countTotalMoney("EUR"));
//console.log("rt", bank.countOweMoneyAllClients("USD"));
//console.log("rt", bank.countDebtorsTotalDebt(true, "usd"));
