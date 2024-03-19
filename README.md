<p align="center">
    <img
    src="https://img.icons8.com/external-smashingstocks-glyph-smashing-stocks/128/737373/external-CRM-team-management-smashingstocks-glyph-smashing-stocks.png"
    width="128px" align="center" alt="logo" />
    <h1 align="center">Submodule | CRM Client</h1>
    <p align="center">Submódulo responsável por padronizar envio de notificações de serviços para o <a href=https://github.com/squidit/worker-crm-dispatcher>CRM Dispatcher</a>.</p>
</p>

## Instalação
1. Na pasta raíz do serviço que deseja incluir esse submódulo, crie um diretório (se não existente) chamado libraries:
    ```bash
    mkdir libraries
    ```

2. Dentro da pasta libraries , adicione esse repositório como submódulo:

    ```bash
    cd libraries
    git submodule add git@github.com:squidit/crm-client.git
    ```

    > Isso faz com que o commit de sua aplicação em NodeJS seja vinculado ao hash do commit da biblioteca. Ou seja, o código fonte da biblioteca não será commitado junto com a sua aplicação, mas apenas "linkado" ao commit dela em seu próprio repositório.

3. Retorne ao diretório raiz do projeto, e inicialize todos os submódulos e suas dependências com o comando:

    ```bash
    cd ..
    git submodule update --init --recursive
    ```
    > Tal comando é o responsável por baixar todos os códigos fontes das bibliotecas e suas dependências.

4. Vincule o submódulo do git ao package.json:

    * npm
        ```bash
        npm install --save file:libraries/crm-client
        ```
    * pnpm
        ```bash
        pnpm add file:libraries/crm-client
        ```

    > Dessa forma, os as bibliotecas locais são incluidas como dependências no gerenciador de pacotes (npm, yarn, pnpm etc). Isso permite que, no código, você possa fazer uso das bibliotecas através de um require { SquidError, SquidLogger } from 'squid-observability' sem se preocupar com o diretório onde essas bibliotecas estão instaladas. Além disso, o gerenciador de pacotes garante que, caso as bibliotecas instaladas via submódulos tenham dependências em comum com sua aplicação, somente uma cópia do código fonte dessas bibliotecas será vinculada a ela, consequentemente reduzindo o tamanho final da aplicação.  
    > Outra vantagem de vincular o submódulo com o package.json é transferir a responsabilidade de instalar as dependencias dos submódulos ao package manager. Ou seja, se uma biblioteca em submódulo fizer uso da lodash, o npm ou yarn da aplicação pai é quem irá instalar essa dependência ao rodarmos npm install.

## Variáveis de ambiente:
Por padrão, o client do CRM procurará uma variável de ambiente de nome `CRM_NOTIFICATION_TOPIC` para utilizar como tópico do PubSub.  
É possível utilizar outro tópico, passando o nome do tópico como parâmetro na inicialização do client.  
É obrigatório que ou a variável de ambiente padrão ou um nome personalizado sejam definidos.


## Utilização: Sem injeção de dependência
1. Na inicialização da sua aplicação, inclua o client do CRM e inicialize-o com as variáveis de ambiente:
    ```ts
    const { CrmClient } = require('crm-client')

    ...

    CrmClient.init(
      GCE_CLUSTER_PROJECT,      // variável de ambiente contendo o nome do projeto do GCP
      GCE_AUTH_JSON_FILENAME,   // variável de ambiente contendo o nome do arquivo de credenciais
      SquidLogger,              // Instância do SquidLogger
      SquidError,               // Instância do SquidError
      // TOPIC_NAME,            // OPCIONAL: Nome do tópico do PubSub. Padrão: CRM_NOTIFICATION_TOPIC
    )
    ```

1. Para enviar uma notificação, obtenha a instância do client com o método `getInstance` e chame o método `sendNotification`:

    ```ts
    await CrmClient
      .getInstance()
      .sendNotification()
    ```

## Utilização: Com injeção de dependência por tsyringe
1. Na inicialização da sua aplicação, inclua o client do CRM e inclua o client do CRM e inicialize-o com as variáveis de ambiente:
    ```typescript
    import { CrmClient } from 'crm-client'

    ...

    CrmClient.init(
      GCE_CLUSTER_PROJECT,      // variável de ambiente contendo o nome do projeto do GCP
      GCE_AUTH_JSON_FILENAME,   // variável de ambiente contendo o nome do arquivo de credenciais
      SquidLogger,              // Instância do SquidLogger
      SquidError,               // Instância do SquidError
      // TOPIC_NAME,            // OPCIONAL: Nome do tópico do PubSub. Padrão: CRM_NOTIFICATION_TOPIC
    )
    ```
1. Após a inicialização, registre a instância no container de injeção de dependência:
    ```ts
    container.register('CrmClient', { useValue: CrmClient.getInstance() })
    ```

1. Para enviar uma notificação, obtenha o client do container e utilize a instância obtida:
    ```ts
    constructor(
      @inject('CrmClient') private readonly crmClient: CrmClient
    ) {}

    ...

    await this.crmClient.sendNotification()
    ```


## Utilização: Com injeção de dependência por NestJS
1. Crie um novo módulo para o client do CRM.  
Utilize uma factory para poder injetar o configService e obter as variáveis de ambiente na inicialização do client.  
Entregue o valor da instância como resultado da factory:
    ```ts
    @Global()
    @Module({
      providers: [{
        provide: 'CrmClient',
        useFactory: (configService: ConfigService<EnvironmentVariables>) => {
          CrmClient.init(
            configService.getOrThrow('GCE_CLUSTER_PROJECT', { infer: true }),
            configService.getOrThrow('GCE_AUTH_JSON_FILENAME', { infer: true }),
            SquidLogger,
            SquidError
          )
          return CrmClient.getInstance()
        },
        inject: [ConfigService]
      }
      ],
      exports: ['CrmClient']
    })
    export class CrmModule {}
    ```

1. Para enviar uma notificação, obtenha o client do container e utilize a instância obtida:
    ```ts
    constructor(
      @Inject('CrmClient') private readonly crmClient: CrmClient
    ) {}

    ...

    await this.crmClient.sendNotification()
    ```