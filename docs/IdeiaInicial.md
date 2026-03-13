# Motivação

Quero criar um sistema (web) que vai me ajudara a gerenciar o repetório de músicas do meu regional.

Quero um lugar onde possamos reunir as musicas que tocamos, montar setlists para shows, acompanhar musicas praticadas em ensaios, pode ter sugestoes de estudo considerando o historico de estudo das musicas. maneira facil e pratica de rastrar os estudos das peças musicas, tanto sozinho como em grupo. que ele sirva indiidualmente a cada membro para gerencia do seu proprio repetorio, ale4m do que ele toca com o musico. a partir dos conhecimentos da neurociencia e ciencia da memoria, propor  pe;cas para serem estudas em momentos chaves para otimizar a apresensão pela memória. 

Para conseguir isso, quero seguir um abordagem agil, e iterativa.

Roadmap inicial

1. Cadastro do Regional
   
   Vamos ter uma tela para cadastrar o regional, com dados basicos, como nome, descricao, membros.

1.1 Vamos possibilitar que um membro consiga cadastrar o regional e todos os membros. Cada memro tera seu perfil, com login e senha e instrumento que toca na banda. 


2. Repertorio
    Apos o cadstro do regional e seus membros, vamos ter uma tela para cadastrar o repertorio. 
    Um item do repertorio tera nome, descricao, links (podem ser varios, pro yotuube, spotify, tidal e etc).
    Nossos sistema vai implementar uma forma de entrada onde o usuario pode entrar uma lista corrida de Musica - Autor, ou so o nome da musica. e o sistema vai faer o parse do txt (copia e cola ou subir txt). quando houver apenas o nome da musica, o ssistema vai buscar na internet para achar o nome do autor. Nosso sistema vai saber pegar os metadadso da musica a partir os links informados. vamos começar sabendo pegar dados do youtube/youtube music, spotigfy e tidal. nosso sistema backend vai oferecer isso para nosso front atraves de uma api. ele vai rodar broser headless para fazer o web scraping. 


3. Com o regional e membros cadastrados, o repertorio, os membroas vao poder logar no sistema para ver o repertorio. A primeira fubncionalidade que vamos oferecer é a de criar seleçòes do repertorio. Seleção vai ser uma entidade do sistema, vamos poder criar seleçoes para diverasas ocasioes. Elas vaoi servir para agrupar musicas do repertorio para podemors ensaiar especificamente, montar setlists de apresentaçao, dar nome a copnjuntos de musicas (selecao musicas pre 1920, selecao musicas choro paulista, etc). a primeira coisa que queremos conseguir fqazer5 é uma votacao. vamos criar uma selecao onde cada membro vai poder escolher musicas do repetorio para a aselecao. Cada selecao tem um numero maximo de musicas. Por exemplo, Selecao para show do dia X, 30 musicas. Cada membro pode votar para as musicas que ele gostaria de ver na show, as mais votadas serao as selecionadas. 


## Descrição tecnico

O sistema vai ser feito em javascript, usando Bun como runtime no backend, e vue com tailwind como framework no frontend.

Vai ser single repo, entao vai ficar tudo num repo so. 

Vamos usar containers para rodar o projeto (docker compose). 

Vamos usar sqlite para o banco de dados. 

Vamos usar typescript. 

vamos usar para referencia o projeto marcio natural https://github.com/mateuscfonseca/marcionatural

nao devemos usar stores do vue, como pinia ou outros. isso é desnecessario. vamos usar o padrao de composables ao inves
  disso, e outras formas nativas, sem precisar de libs para gerenciar estados ​

  nao qierpo fpcar na parte de meta dados agora. vamos implementar no primeiro momento apenas integracao com buscas no spotify. se necessario, verifique a
  documentacao do spotify. eu vou criar um app no dashboard de desenvolvedor deles. seria importante vc criar um markdown em docs/ com as instruçoes de como
  criar e usar um app para usar a api do spotify (vamos usar para pegar metadata de musicas, autocompletes e etc) ​

  algo que acabei esquecendo de solicitar é que o design do site deve ser mobile first, isso é muito impoortante. ​