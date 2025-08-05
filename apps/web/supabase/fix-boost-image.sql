-- Fix BOOST token image URL
UPDATE tokens
SET image_url = 'https://salmon-electronic-stingray-461.mypinata.cloud/ipfs/bafybeid77xcetcoqttdobla5nfegwas5m6s5bnnlibnqlznj2uwwj64pfq'
WHERE mint_address = 'BRvY7fCrjABsxfmYjtdFSifrQMN7atU4kehSShdyvw9r'; 