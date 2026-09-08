export interface DocGuideItem {
    docName: string;
    accepted: string;
    where: string;
    hack: string;
}

export const PATHWAY_DOCS_DETAIL_GUIDE: Record<string, Record<string, DocGuideItem[]>> = {
    pt: {
        art88: [
            {
                docName: "📋 Contrato ou Promessa de Trabalho",
                accepted: "Contrato de Trabalho escrito assinado nos termos da lei portuguesa, ou Promessa de Contrato de Trabalho escrita que mencione funções, horário e salário.",
                where: "Fornecido pela entidade empregadora (empresa) em Portugal.",
                hack: "O contrato deve ser registado nas Finanças (AT) e Segurança Social pelo empregador. Garanta que o salário proposto é igual ou superior ao Salário Mínimo Nacional (SMN) para evitar recusa automática."
            },
            {
                docName: "✈️ Visto de Residência Consular Válido (Art. 88.º, n.º 1)",
                accepted: "Visto de Residência consular prévio para exercício de atividade profissional subordinada aposto no passaporte (emitido no país de origem antes da viagem).",
                where: "Posto Consular / Embaixada de Portugal no país de residência habitual.",
                hack: "Atenção: O Decreto-Lei n.º 37-A/2024 revogou as antigas Manifestações de Interesse. A entrada com visto de turista não permite regularização por trabalho; é obrigatório obter visto consular prévio de residência ou visto de procura de trabalho antes de viajar."
            },
            {
                docName: "💳 NIF e NISS ativos (Obtenção prévia ou presencial)",
                accepted: "Documento oficial do Número de Identificação Fiscal (NIF) com morada atualizada e Número de Identificação de Segurança Social (NISS).",
                where: "Autoridade Tributária (Finanças) e Instituto da Segurança Social (ISS).",
                hack: "Canais Oficiais Pré-Chegada: Os consulados não atribuem NIF nem NISS como regra geral. Para obter NIF antes de chegar a Portugal, o pedido é feito junto da AT (e-Balcão ou presencial) através de representante legal/procurador munido de procuração e passaporte (nota: representante legal para pedido é distinto de representante fiscal). O NISS pré-chegada pode ser requerido no portal da Segurança Social por representante legal ou pela entidade empregadora mediante contrato/promessa de trabalho. Após a chegada, o NISS pode ser obtido presencialmente no serviço 'NISS na Hora'."
            }
        ],
        art89: [
            {
                docName: "📋 Declaração de Início de Atividade (Finanças & Segurança Social)",
                accepted: "Comprovativo oficial de abertura de atividade nas Finanças com CAE (Atividade Económica) ou código de IRS válido.",
                where: "Portal das Finanças (online) ou balcão de um Serviço de Finanças.",
                hack: "Início e Cessação de Atividade (Regime Canónico): A declaração de início de atividade deve ser entregue nas Finanças ANTES de iniciar qualquer operação (Art. 112.º, n.º 1 do CIRS). A AT comunica oficiosamente à Segurança Social (Art. 143.º do CRCSPSS), que inscreve automaticamente o trabalhador (Art. 144.º) — não existe prazo de 30 dias para comunicação manual à SS! O enquadramento normal produz efeitos no 1.º dia do 12.º mês (Art. 145.º), podendo o trabalhador requerer antecipação facultativa via declaração trimestral (Art. 146.º). Em caso de encerramento, a cessação deve ser comunicada nas Finanças em até 30 dias (Art. 33.º do CIVA e Art. 112.º, n.º 4 do CIRS); a SS cessa oficiosamente o enquadramento (Art. 147.º, n.º 2) com efeitos no 1.º dia do mês seguinte (Art. 148.º)."
            },
            {
                docName: "📄 Contrato de Prestação de Serviços",
                accepted: "Contrato escrito de prestação de serviços com clientes ou faturas-recibo eletrónicas (Recibos Verdes) emitidos nos últimos meses.",
                where: "Celebrado entre si e o cliente (empresa ou particular).",
                hack: "Ter pelo menos um contrato de prestação de médio ou longo prazo com uma empresa nacional ou internacional aumenta exponencialmente a taxa de aprovação do seu pedido na AIMA."
            }
        ],
        art90a: [
            {
                docName: "💰 Prova de Rendimentos Médios (Nómada Digital)",
                accepted: "Extratos bancários carimbados dos últimos 3 meses e declarações fiscais provando rendimento mensal médio superior a 4 salários mínimos (4 x 920€ = €3.680/mês).",
                where: "Bancos (extratos originais) e Autoridade Fiscal do seu país de origem.",
                hack: "O rendimento deve vir de fora de Portugal. A AIMA exige prova de vínculo laboral (contrato de trabalho remoto ou de prestação com entidades estrangeiras)."
            },
            {
                docName: "🇵🇹 NIF e Conta Bancária Portuguesa",
                accepted: "NIF português ativo e extrato de conta bancária aberta em banco sediado em Portugal.",
                where: "Portal das Finanças (NIF) e balcão físico ou online de banco português.",
                hack: "Pode abrir a conta bancária portuguesa de forma online antes de viajar (através de bancos digitais nacionais ou advogados com procuração)."
            }
        ],
        visa_d7: [
            {
                docName: "📈 Comprovativo de Rendimentos Passivos (Pensões ou outros)",
                accepted: "Declaração oficial da entidade de pensões (INSS ou equivalente), contratos de arrendamento registados com comprovativos de recebimento, dividendos ou aplicações financeiras de valor estável superior ao salário mínimo líquido anual português (920€/mês ou 11.040€/ano).",
                where: "Segurança Social ou Instituto de Pensões do país de origem, bancos ou registo predial.",
                hack: "A lei portuguesa exige um mínimo de rendimento passivo mensal garantido equivalente ao salário mínimo nacional (920€). Para o cônjuge, adicione 50% (460€), e para cada filho, 30% (276€). Certifique-se de apostilar/legalizar e traduzir oficialmente todas as declarações estrangeiras."
            },
            {
                docName: "🇵🇹 NIF e Conta Bancária em Portugal com Fundos",
                accepted: "Documento oficial do NIF português (com morada atualizada ou representação fiscal) e extrato oficial da conta bancária em Portugal com os saldos demonstrativos.",
                where: "Autoridade Tributária (Finanças) e qualquer instituição bancária sediada em Portugal.",
                hack: "Abra a sua conta bancária portuguesa de forma 100% remota através de bancos digitais nacionais ou nomeando um procurador legal (advogado). Transfira o montante total equivalente a pelo menos 1 ano de rendimentos (mínimo de €11.040 a €15.000+ por pessoa) para a conta portuguesa antes de submeter o visto no consulado: este saldo líquido depositado em Portugal é o principal segredo de aprovação do visto D7!"
            },
            {
                docName: "🏠 Comprovativo de Alojamento de Longa Duração",
                accepted: "Contrato de arrendamento assinado por prazo igual ou superior a 1 ano (registado nas Finanças), Escritura de compra de imóvel em Portugal, ou Termo de Responsabilidade/Alojamento assinado por cidadão nacional ou residente legal.",
                where: "Proprietário do imóvel (senhorio) ou familiar/amigo residente legal em Portugal.",
                hack: "Evite apresentar reservas temporárias de hotéis ou Booking de curto prazo (como 15 ou 30 dias), pois o consulado costuma recusar por falta de morada estável. Se não tiver um contrato de arrendamento logo no início, peça a um amigo ou familiar residente legal para assinar um Termo de Alojamento anexando a caderneta predial do imóvel ou contrato dele."
            },
            {
                docName: "🏥 Seguro de Saúde Internacional ou PB4",
                accepted: "Apólice de seguro de saúde privado com cobertura médica mínima de €30.000 (incluindo repatriação médica), ou documento de acordo bilateral de saúde ativo.",
                where: "Seguradoras privadas internacionais ou Ministério da Saúde do país de origem (por exemplo, Portal Gov.br para o PB4 brasileiro).",
                hack: "Se for de nacionalidade brasileira, pode requerer gratuitamente o formulário PB4 (certificado de direito à assistência médica CDAM) online em menos de 3 dias úteis. O PB4 substitui na totalidade a exigência de seguro de saúde privado caro tanto no consulado como na AIMA!"
            }
        ],
        visa_d4: [
            {
                docName: "🎓 Matrícula ou Carta de Aceitação",
                accepted: "Documento oficial de aceitação emitido por universidade, politécnico ou escola secundária em Portugal.",
                where: "Secretaria da instituição de ensino portuguesa.",
                hack: "Verifique se a instituição de ensino superior é reconhecida pela DGES. Para vistos de longa duração, o curso tem de conferir grau académico ou ser equivalente. O estudante tem direito legal de trabalhar a contrato ou recibos verdes (Art. 97.º da Lei 23/2007)."
            },
            {
                docName: "💰 Prova de Meios de Subsistência",
                accepted: "Extrato bancário provando posse de fundos para o ano letivo, comprovativo de bolsa, ou Termo de Responsabilidade assinado por cidadão/residente em Portugal.",
                where: "Bancos ou declaração assinada pelo familiar/patrocinador.",
                hack: "Se tiver uma bolsa de estudos oficial ou um contrato de estágio remunerado, estes documentos dispensam a necessidade de provar saldos elevados em conta bancária."
            }
        ],
        visa_job_search: [
            {
                docName: "📋 Declaração de Registo no IEFP",
                accepted: "Comprovativo oficial em PDF de registo de candidatura a emprego com código QR válido.",
                where: "Portal online do IEFP (Instituto do Emprego e Formação Profissional).",
                hack: "Deve fazer este registo online ANTES de ir ao Consulado pedir o visto. É gratuito e o PDF é gerado imediatamente no perfil após preencher os dados."
            },
            {
                docName: "💰 Meios de Subsistência Mínimos",
                accepted: "Extrato bancário pessoal mostrando o equivalente a pelo menos 3 vezes o salário mínimo nacional líquido (3 x 920€ = €2.760).",
                where: "Extratos bancários oficiais carimbados pelo seu banco.",
                hack: "Este valor em conta pode ser 100% dispensado se um cidadão português ou estrangeiro residente legal em Portugal assine um Termo de Responsabilidade oficial garantindo o seu sustento e alojamento."
            }
        ],
        art122: [
            {
                docName: "👥 Certidões de Vínculo Familiar",
                accepted: "Certidão de Casamento, Certidão de Nascimento dos filhos ou declaração oficial de união de facto.",
                where: "Registo Civil do país de origem (obrigatoriamente Apostiladas ou legalizadas pelo Consulado Português).",
                hack: "Qualquer documento emitido em língua estrangeira tem de ser traduzido para português e a tradução deve ser certificada (por notário, advogado português ou Consulado) para ser aceite pela AIMA."
            }
        ],
        family: [
            {
                docName: "👨‍👩‍👧 Certidões Civis e Vínculo de Parentesco",
                accepted: "Certidão de Casamento, Certidão de Nascimento dos filhos ou Certidão de União de Facto comprovada oficialmente.",
                where: "Registo Civil do país de origem (obrigatoriamente Apostiladas de Haia ou autenticadas pelo Consulado de Portugal).",
                hack: "Todas as certidões estrangeiras devem ter sido emitidas recentemente (idealmente há menos de 6 meses), estar devidamente apostiladas de Haia no país de origem e acompanhadas de tradução juramentada/certificada para português."
            },
            {
                docName: "💰 Prova de Meios de Subsistência Familiares",
                accepted: "Recibos de vencimento dos últimos 3 meses, Declaração de IRS com Nota de Liquidação, ou extrato bancário com saldo anual familiar (Portaria 1563/2007: 100% titular 920€/mês + 50% cônjuge 460€/mês + 30% por filho 276€/mês).",
                where: "Entidade empregadora em Portugal, Autoridade Tributária (Portal das Finanças) ou Banco em Portugal.",
                hack: "O cálculo de subsistência é anual. Para reagrupar cônjuge e 1 filho menor, deve comprovar rendimento mensal estável de pelo menos €1.656 (ou saldo acumulado anual correspondente a €19.872)."
            },
            {
                docName: "🏠 Comprovativo de Alojamento Condigno",
                accepted: "Contrato de Arrendamento registado nas Finanças (AT) com os respetivos recibos eletrónicos de renda, Escritura / Caderneta Predial Urbana atualizada, ou Atestado da Junta de Freguesia com o agregado.",
                where: "Portal das Finanças (senhorio), Conservatória do Registo Predial ou Junta de Freguesia da área de residência.",
                hack: "A AIMA exige que o alojamento tenha capacidade adequada para a dimensão do agregado familiar reagrupado. Certifique-se de que o contrato de arrendamento está ativo e registado nas Finanças."
            },
            {
                docName: "🏛️ Título de Residência do Chamador & Registo Criminal",
                accepted: "Autorização de Residência válida do requerente em Portugal e Certificado de Registo Criminal do país de origem de todos os familiares maiores de 16 anos.",
                where: "AIMA (Título do residente) e Ministério da Justiça / Polícia do país de origem dos dependentes (Apostilado de Haia).",
                hack: "Se os familiares estiverem fora de Portugal, após deferimento ou para entrada, o pedido de Visto de Residência D6 de Reagrupamento Familiar é instruído no Posto Consular de Portugal."
            }
        ],
        via_verde: [
            {
                docName: "💼 Promessa ou Contrato de Trabalho da Empresa",
                accepted: "Contrato de trabalho formal ou Promessa de Trabalho vinculativa com empresa sediada em Portugal ou empresa com certificação Tech Visa.",
                where: "Entidade empregadora em Portugal.",
                hack: "A empresa deve emitir o Termo de Responsabilidade empresarial oficial e registar a oferta no IEFP ou possuir certificação IAPMEI (Tech Visa)."
            },
            {
                docName: "📄 Termo de Responsabilidade Empresarial",
                accepted: "Termo de responsabilidade assinado pela empresa para alojamento e despesas de subsistência e repatriamento se necessário.",
                where: "Assinado pela gerência/RH da empresa empregadora.",
                hack: "O Termo de Responsabilidade emitido por entidade empresarial substitui a exigência de fundos pessoais elevados na conta do trabalhador no consulado."
            }
        ],
        asylum: [
            {
                docName: "🛡️ Pedido de Proteção Internacional (Asilo)",
                accepted: "Declaração formal de pedido de asilo apresentada à Polícia de Segurança Pública (PSP), GNR ou diretamente à AIMA / CPR.",
                where: "Posto de fronteira, esquadra da PSP/GNR ou Conselho Português para os Refugiados (CPR).",
                hack: "A apresentação do pedido de asilo suspende de imediato qualquer procedimento de afastamento ou expulsão e confere direito a Declaração de Pedido de Asilo e apoio do CPR."
            },
            {
                docName: "📄 Declaração de Residência e Apoio Social",
                accepted: "Comprovativo de morada ou declaração de acolhimento emitida por centro de acolhimento humanitário (CPR/Cruz Vermelha/SCML).",
                where: "Entidades de acolhimento social ou Junta de Freguesia.",
                hack: "Requerentes de asilo têm direito a apoio médico no SNS e a Autorização de Residência Provisória após admissão do processo pela AIMA."
            }
        ],
        voluntary_return: [
            {
                docName: "✈️ 1. Inscrição no Programa ARVoRe VIII (OIM / AIMA)",
                accepted: "Inscrição formal preenchida e submetida online no portal retornovoluntario.pt, por email (arvore@iom.int / retornovoluntario@iom.int) ou presencialmente nos balcões do CNAIM / CLAIM.",
                where: "Gabinete da OIM Portugal (Lisboa: Rua José Estêvão, 137 / Tel: 808 257 257 ou +351 21 324 2940) ou balcões oficiais AIMA / CNAIM.",
                hack: "O processo é 100% gratuito, confidencial e digno. A OIM não partilha dados com entidades policiais de forma punitiva. Todos os cidadãos estrangeiros sem capacidade financeira para custear a viagem podem candidatar-se."
            },
            {
                docName: "🛂 2. Passaporte Nacional ou Salvo-Conduto Consular",
                accepted: "Passaporte válido ou caducado do país de origem, OU Título de Viagem Única / Salvo-Conduto (Laissez-Passer) emitido pelo Consulado ou Embaixada em Portugal.",
                where: "Consulado ou Embaixada do país de origem em Lisboa ou Porto.",
                hack: "Se o seu passaporte estiver perdido, retido ou expirado, a equipa técnica da OIM faz a articulação direta com a sua representação consular e apoia no pagamento das taxas de emissão do documento de viagem."
            },
            {
                docName: "🎫 3. Passagem Aérea & Assistência no Aeroporto",
                accepted: "Bilhete de avião internacional emitido e pago integralmente pela OIM até à cidade de destino mais próxima da sua residência no país de origem, com bagagem de porão incluída.",
                where: "Gerido e emitido diretamente pela OIM Portugal em articulação com as companhias aéreas.",
                hack: "Migrantes com problemas de saúde, grávidas, idosos ou famílias com crianças recebem apoio logístico e acompanhamento assistencial presencial no Aeroporto de Lisboa ou Porto até ao embarque no avião."
            },
            {
                docName: "💼 4. Apoio à Reintegração & Subsídio de Micro-Negócio",
                accepted: "Plano de reintegração socioeconómica validado para concessão de apoio financeiro no país de origem (compra de ferramentas de trabalho, equipamento, formação ou apoio educacional).",
                where: "Gabinetes locais da OIM e parceiros sociais no país de regresso.",
                hack: "O subsídio de reintegração pós-chegada não é entregue em dinheiro líquido no aeroporto, mas sim gerido em projetos de capacitação e compra de bens produtivos para garantir a sustentabilidade económica da família."
            }
        ]
    },
    en: {
        art88: [
            {
                docName: "📋 Employment Contract or Promise",
                accepted: "Written Employment Contract signed under Portuguese labor law, or a written Promise of Employment Contract detailing duties, schedule, and salary.",
                where: "Provided by the employer (company) in Portugal.",
                hack: "The contract must be registered at the Tax Authority (AT) and Social Security by the employer. Ensure the proposed salary is equal to or higher than the National Minimum Wage to avoid automatic rejection."
            },
            {
                docName: "✈️ Valid Consular Residence Visa (Art. 88, para 1)",
                accepted: "Prior consular Residence Visa for subordinate professional activity affixed to your passport (issued in your home country prior to travel).",
                where: "Consular Post / Embassy of Portugal in your country of origin or habitual residence.",
                hack: "Important Notice: Decree-Law no. 37-A/2024 revoked the former Expressions of Interest. Tourist entry no longer permits employment regularization; obtaining a prior consular residence visa or job seeker visa before traveling is mandatory."
            },
            {
                docName: "💳 Active NIF and NISS (Pre-arrival or In-person)",
                accepted: "Official document of Tax Identification Number (NIF) with updated address and Social Security Identification Number (NISS).",
                where: "Tax Authority (AT - Finanças) and Social Security Institute (ISS).",
                hack: "Official Pre-Arrival Channels: Portuguese consulates do not issue NIF or NISS as a general rule. To obtain a NIF before arriving, the request is submitted to the AT (e-Balcão or tax office) by a legal representative/power of attorney holder with a passport and mandate (a legal representative for NIF request is distinct from a tax representative). Pre-arrival NISS can be requested online via Social Security by a legal representative or by your prospective employer holding an employment contract/promise. After arrival, NISS can be obtained in person via the 'NISS na Hora' service."
            }
        ],
        art89: [
            {
                docName: "📋 Declaration of Start of Activity (Tax & Social Security)",
                accepted: "Official proof of opening of activity at Finanças with a valid CAE (Economic Activity) or IRS code.",
                where: "Portal das Finanças (online) or at a local Tax Office counter.",
                hack: "Start & Cessation of Activity (Statutory Rules): The declaration of commencement of activity must be filed at Finanças BEFORE starting any business operations (Art. 112, no. 1 CIRS). The Tax Authority automatically communicates this to Social Security (Art. 143 CRCSPSS), which registers the worker automatically (Art. 144) — there is no 30-day manual notice requirement to SS! Normal enrollment takes effect on the 1st day of the 12th month (Art. 145), though the worker may request voluntary early enrollment via quarterly declaration (Art. 146). For closure, cessation must be reported at Finanças within 30 days (Art. 33 CIVA & Art. 112, no. 4 CIRS); SS automatically closes enrollment (Art. 147, no. 2) effective the 1st day of the following month (Art. 148)."
            },
            {
                docName: "📄 Service Agreement / Invoices",
                accepted: "Written service agreement with clients or electronic receipt-invoices (Recibos Verdes) issued in recent months.",
                where: "Signed between you and the client (company or individual).",
                hack: "Having at least one medium or long-term service contract with a national or international company exponentially increases the approval rate of your application at AIMA."
            }
        ],
        art90a: [
            {
                docName: "💰 Proof of Average Income (Digital Nomad)",
                accepted: "Stamped bank statements of the last 3 months and tax returns proving an average monthly income higher than 4 minimum wages (4 x €920 = €3,680/mo).",
                where: "Banks (original statements) and the Tax Authority of your country of origin.",
                hack: "The income must originate from outside Portugal. AIMA requires proof of employment relationship (remote contract or active service contract with foreign entities)."
            },
            {
                docName: "🇵🇹 NIF and Portuguese Bank Account",
                accepted: "Active Portuguese NIF and account statement from a bank based in Portugal.",
                where: "Portal das Finanças (NIF) and physical or online branch of a Portuguese bank.",
                hack: "You can open the Portuguese bank account online before traveling (via national digital banks or lawyers with power of attorney)."
            }
        ],
        visa_d7: [
            {
                docName: "📈 Proof of Passive Income (Pensions or others)",
                accepted: "Official pension statement (Social Security or equivalent), registered lease agreements with proof of rent receipt, dividends, or stable financial investments exceeding the annual net Portuguese minimum wage (€920/mo or €11,040/year).",
                where: "Pension institution of the country of origin, banks, or land registry.",
                hack: "Portuguese law requires a minimum guaranteed monthly passive income equivalent to the national minimum wage (€920). Add 50% (€460) for a spouse, and 30% (€276) for each dependent child. Ensure you apostille/legalize and officially translate all foreign statements."
            },
            {
                docName: "🇵🇹 NIF and Portuguese Bank Account with Funds",
                accepted: "Official Portuguese NIF document (with updated address or fiscal representation) and official bank statement from a bank in Portugal showing the deposited balance.",
                where: "Tax Authority (Finanças) and any banking institution based in Portugal.",
                hack: "Open your Portuguese bank account 100% remotely via national digital banks or by appointing a legal representative (lawyer). Transfer the total amount equivalent to at least 1 year of income (minimum €11,040 to €15,000+ per person) to the Portuguese account before applying: this liquid balance deposited in Portugal is the main secret to D7 visa approval!"
            },
            {
                docName: "🏠 Proof of Long-term Accommodation",
                accepted: "Lease agreement signed for a term of 1 year or more (registered with the Portuguese Tax Authority), property deed in Portugal, or a Statement of Responsibility/Accommodation signed by a Portuguese citizen or legal resident.",
                where: "Property owner (landlord) or relative/friend who is a legal resident in Portugal.",
                hack: "Avoid submitting short-term hotel or Booking reservations (e.g., 15 or 30 days), as the consulate usually rejects them for lack of stable housing. If you do not have a lease agreement yet, ask a friend or family member who is a legal resident to sign a Statement of Accommodation along with their property registry copy."
            },
            {
                docName: "🏥 International Health Insurance or PB4 Agreement",
                accepted: "Private health insurance policy with minimum medical coverage of €30,000 (including repatriation), or active bilateral health agreement document.",
                where: "Private international insurance companies or Ministry of Health of the country of origin (e.g., Gov.br Portal for the Brazilian PB4).",
                hack: "If you are a Brazilian national, you can request the PB4 form (CDAM) online for free in under 3 business days. The PB4 completely replaces the requirement for expensive private health insurance both at the consulate and at AIMA!"
            }
        ],
        visa_d4: [
            {
                docName: "🎓 Enrolment or Acceptance Letter",
                accepted: "Official acceptance document issued by a university, polytechnic, or secondary school in Portugal.",
                where: "Registrar office of the Portuguese educational institution.",
                hack: "Check if the higher education institution is recognized by DGES. For long-term visas, the course must award an academic degree or be equivalent. Students are legally entitled to work under employment contract or as freelancers (Article 97 of Law 23/2007)."
            },
            {
                docName: "💰 Proof of Subsistence Means",
                accepted: "Bank statement proving possession of funds for the school year, proof of scholarship, or a Statement of Responsibility signed by a citizen/resident in Portugal.",
                where: "Banks or declaration signed by the relative/sponsor.",
                hack: "If you have an official scholarship or a paid internship contract, these documents waive the need to prove large bank account balances."
            }
        ],
        visa_job_search: [
            {
                docName: "📋 IEFP Registration Declaration",
                accepted: "Official PDF proof of job seeker registration with a valid QR code.",
                where: "Online portal of the IEFP (Institute of Employment and Vocational Training).",
                hack: "You must register online BEFORE going to the Consulate to apply for the visa. It is free and the PDF is generated instantly in the profile after filling in the details."
            },
            {
                docName: "💰 Minimum Subsistence Means",
                accepted: "Personal bank statement showing the equivalent of at least 3 times the net national minimum wage (3 x €920 = €2,760).",
                where: "Official bank statements stamped by your bank.",
                hack: "This bank balance requirement can be 100% waived if a Portuguese citizen or a legal resident foreigner in Portugal signs an official Statement of Responsibility guaranteeing your support and lodging."
            }
        ],
        art122: [
            {
                docName: "👥 Proof of Family Relationship",
                accepted: "Marriage Certificate, birth certificates of children, or official declaration of stable civil union.",
                where: "Civil Registry of the country of origin (must be Apostilled or legalized by the Portuguese Consulate).",
                hack: "Any document issued in a foreign language must be translated into Portuguese, and the translation must be certified (by a notary, a Portuguese lawyer, or Consulate) to be accepted by AIMA."
            }
        ],
        family: [
            {
                docName: "👨‍👩‍👧 Civil Certificates & Family Ties",
                accepted: "Marriage Certificate, birth certificates of children, or official declaration of civil partnership.",
                where: "Civil Registry of the country of origin (must be Hague Apostilled or legalized by the Portuguese Consulate).",
                hack: "All foreign certificates must be recently issued (ideally less than 6 months), properly Hague apostilled in the country of origin, and accompanied by a certified Portuguese translation."
            },
            {
                docName: "💰 Proof of Family Subsistence Means",
                accepted: "Pay slips of the last 3 months, IRS Tax Return with Assessment Note, or bank statement showing annual family funds (Order 1563/2007: 100% sponsor €920/mo + 50% spouse €460/mo + 30% per child €276/mo).",
                where: "Employer in Portugal, Tax Authority (Finanças), or Portuguese bank account.",
                hack: "Subsistence is calculated annually. To reunite a spouse and 1 minor child, you must prove stable monthly income of at least €1,656 (or annual equivalent balance of €19,872)."
            },
            {
                docName: "🏠 Proof of Adequate Accommodation",
                accepted: "Lease agreement registered with Finanças (AT) with electronic rent receipts, property deed / updated tax register (Caderneta Predial), or Parish Council certificate (Junta de Freguesia).",
                where: "Tax Authority portal (landlord), Land Registry, or local Parish Council.",
                hack: "AIMA requires that the accommodation has adequate capacity for the size of the reunited household. Ensure the lease contract is active and in your name."
            },
            {
                docName: "🏛️ Sponsor's Residence Permit & Criminal Records",
                accepted: "Valid Portuguese Residence Permit of the sponsor and Criminal Record certificates from the country of origin for all family members aged 16+.",
                where: "AIMA (Sponsor's title) and Ministry of Justice / Police of the dependents' home country (Hague Apostilled).",
                hack: "If family members are outside Portugal, after approval or for travel, the D6 Family Reunification Residence Visa must be processed at the Portuguese Consulate."
            }
        ],
        via_verde: [
            {
                docName: "💼 Company Promise or Employment Contract",
                accepted: "Formal employment contract or binding Promise of Contract with a company based in Portugal or a Tech Visa certified entity.",
                where: "Employer company in Portugal.",
                hack: "The company must issue the official corporate Statement of Responsibility and register the offer with IEFP or hold IAPMEI certification (Tech Visa)."
            },
            {
                docName: "📄 Corporate Statement of Responsibility",
                accepted: "Statement of responsibility signed by the company covering lodging, subsistence, and repatriation if needed.",
                where: "Signed by company management/HR in Portugal.",
                hack: "The corporate Statement of Responsibility waives the requirement for large personal bank balances at the consulate."
            }
        ],
        asylum: [
            {
                docName: "🛡️ International Protection (Asylum) Application",
                accepted: "Formal asylum application declaration submitted to the Public Security Police (PSP), GNR, or directly to AIMA / CPR.",
                where: "Border post, police station, or Portuguese Refugee Council (CPR).",
                hack: "Filing an asylum request immediately suspends any deportation procedure and grants an Asylum Application Certificate and CPR legal aid."
            },
            {
                docName: "📄 Proof of Address and Social Support",
                accepted: "Proof of address or reception certificate issued by a humanitarian reception center (CPR / Red Cross / SCML).",
                where: "Social reception institutions or local Parish Council.",
                hack: "Asylum seekers have full right to SNS medical healthcare and a Provisional Residence Permit once the application is admitted by AIMA."
            }
        ],
        voluntary_return: [
            {
                docName: "✈️ 1. ARVoRe VIII Program Registration (IOM / AIMA)",
                accepted: "Formal registration submitted online at retornovoluntario.pt, via email (arvore@iom.int / retornovoluntario@iom.int), or in person at CNAIM/CLAIM offices.",
                where: "IOM Portugal office (Lisbon: Rua José Estêvão, 137 / Tel: +351 21 324 2940 or 808 257 257) or official AIMA / CNAIM service centers.",
                hack: "The process is 100% free, confidential, and safe. IOM does not share personal data for punitive purposes. Any foreign national lacking financial means to travel home can apply."
            },
            {
                docName: "🛂 2. National Passport or Consular Travel Document",
                accepted: "Valid or expired passport from home country, OR Emergency Travel Certificate / Laissez-Passer issued by your home country Consulate in Portugal.",
                where: "Consulate or Embassy of your home country in Lisbon or Porto.",
                hack: "If your passport is lost, retained, or expired, the IOM team directly liaises with your consulate and can cover the issuance fees for your emergency travel certificate."
            },
            {
                docName: "🎫 3. Flight Ticket & Airport Assistance",
                accepted: "International flight ticket fully funded and issued by IOM to the airport nearest to your home town, including checked baggage allowance.",
                where: "Issued directly by IOM Portugal in coordination with commercial airlines.",
                hack: "Vulnerable individuals, pregnant women, elderly citizens, and families with children receive dedicated in-person airport assistance in Lisbon or Porto until boarding."
            },
            {
                docName: "💼 4. Reintegration Grant & Micro-Business Support",
                accepted: "Socio-economic reintegration plan approved for post-arrival financial aid (vocational training, business equipment purchase, or educational support).",
                where: "Local IOM offices and partner organizations in your destination country.",
                hack: "The post-arrival reintegration grant is managed through tool purchases and vocational projects rather than raw cash, ensuring long-term family self-sufficiency."
            }
        ]
    },
    es: {
        art88: [
            {
                docName: "📋 Contrato o Promesa de Trabajo",
                accepted: "Contrato de Trabajo escrito firmado bajo la ley laboral portuguesa, o una Promesa de Contrato escrita que mencione funciones, horario y salario.",
                where: "Proporcionado por el empleador (empresa) en Portugal.",
                hack: "El contrato debe ser registrado en Hacienda (AT) y en la Seguridad Social por el empleador. Asegúrese de que el salario propuesto sea igual o superior al Salario Mínimo Nacional (SMN) para evitar el rechazo automático."
            },
            {
                docName: "✈️ Visado de Residencia Consular Válido (Art. 88, n.º 1)",
                accepted: "Visado de Residencia consular previo para el ejercicio de actividad laboral subordinada estampado en el pasaporte (emitido en el país de origen antes de viajar).",
                where: "Puesto Consular / Embajada de Portugal en el país de origen o residencia habitual.",
                hack: "Atención: El Decreto-Ley n.º 37-A/2024 revocó las antiguas Manifestaciones de Interés. La entrada como turista ya no permite la regularización por trabajo; es obligatorio obtener un visado consular de residencia o visado de búsqueda de trabajo antes de viajar."
            },
            {
                docName: "💳 NIF y NISS activos (Obtención previa o presencial)",
                accepted: "Documento oficial del Número de Identificación Fiscal (NIF) con dirección actualizada y Número de Identificación de la Seguridad Social (NISS).",
                where: "Autoridad Tributaria (AT - Finanças) e Instituto de la Seguridad Social (ISS).",
                hack: "Canales Oficiales Previos a la Llegada: Los consulados portugueses no asignan NIF ni NISS como norma general. Para obtener el NIF antes de viajar, la solicitud se tramita ante la AT (e-Balcão o presencial) mediante un representante legal/apoderado con poder notarial y pasaporte (el apoderado para solicitar el NIF es una figura distinta del representante fiscal). El NISS antes de la llegada puede ser solicitado en la Seguridad Social por un representante legal o por el empleador con contrato/promesa laboral. Tras la llegada, el NISS se puede obtener en persona mediante el servicio 'NISS na Hora'."
            }
        ],
        art89: [
            {
                docName: "📋 Declaración de Inicio de Actividad (Hacienda & Seguridad Social)",
                accepted: "Comprobante oficial de apertura de actividad en Hacienda con CAE (Actividad Económica) o código de IRS válido.",
                where: "Portal das Finanças (en línea) o en el mostrador de una oficina de Hacienda local.",
                hack: "Inicio y Cese de Actividad (Régimen Normativo): La declaración de inicio de actividad debe presentarse en Hacienda ANTES de comenzar cualquier actividad (Art. 112, n.º 1 CIRS). La AT comunica de oficio a la Seguridad Social (Art. 143 CRCSPSS), que inscribe automáticamente al trabajador (Art. 144) — ¡no existe plazo de 30 días para notificación manual a la SS! El encuadre normal surte efectos el primer día del mes 12 (Art. 145), pudiendo solicitarse la anticipación facultativa mediante la declaración trimestral (Art. 146). Para el cierre, el cese debe comunicarse en Hacienda en un plazo de hasta 30 días (Art. 33 CIVA y Art. 112, n.º 4 CIRS); la SS extingue de oficio el encuadre (Art. 147, n.º 2) con efectos el primer día del mes siguiente (Art. 148)."
            },
            {
                docName: "📄 Contrato de Prestación de Servicios",
                accepted: "Contrato de prestación de servicios por escrito con clientes o facturas-recibos electrónicos (Recibos Verdes) emitidos en los últimos meses.",
                where: "Firmado entre usted y el cliente (empresa o particular).",
                hack: "Tener al menos un contrato de servicios a mediano o largo plazo con una empresa nacional o internacional aumenta exponencialmente la tasa de aprobación de su solicitud en AIMA."
            }
        ],
        art90a: [
            {
                docName: "💰 Prueba de Ingresos Medios (Nómada Digital)",
                accepted: "Extractos bancarios sellados de los últimos 3 meses y declaraciones fiscales que demuestren un ingreso mensual promedio superior a 4 salarios mínimos (4 x 920€ = €3.680/mes).",
                where: "Bancos (extractos originales) y la Autoridad Fiscal de su país de origen.",
                hack: "Los ingresos deben provenir de fuera de Portugal. AIMA requiere prueba de relación laboral (contrato remoto o contrato de servicios activo con entidades extranjeras)."
            },
            {
                docName: "🇵🇹 NIF y Cuenta Bancaria Portuguesa",
                accepted: "NIF portugués activo y extracto de cuenta bancaria abierta en un banco con sede en Portugal.",
                where: "Portal das Finanças (NIF) y sucursal física o en línea de un banco portugués.",
                hack: "Puede abrir la cuenta bancaria portuguesa en línea antes de viajar (a través de bancos digitales nacionales o abogados con poder notarial)."
            }
        ],
        visa_d7: [
            {
                docName: "📈 Comprobante de Ingresos Pasivos (Pensiones u otros)",
                accepted: "Declaración oficial de la entidad de pensiones (Seguridad Social o equivalente), contratos de alquiler registrados con recibos, dividendos o inversiones financieras estables que superen el salario mínimo líquido anual portugués (920€/mes o 11.040€/año).",
                where: "Institución de pensiones del país de origen, bancos o registro de la propiedad.",
                hack: "La ley portuguesa exige un ingreso pasivo mensual mínimo garantizado equivalente al salario mínimo nacional (920€). Sume un 50% (460€) para el cónyuge y un 30% (276€) por cada hijo. Asegúrese de apostillar/legalizar y traducir oficialmente todas las declaraciones extranjeras."
            },
            {
                docName: "🇵🇹 NIF y Cuenta Bancaria en Portugal con Fondos",
                accepted: "Documento oficial del NIF portugués y extracto oficial de la cuenta bancaria en Portugal con saldos demostrativos.",
                where: "Autoridad Tributaria (Finanças) y cualquier institución bancaria con sede en Portugal.",
                hack: "Abra su cuenta bancaria portuguesa de forma 100% remota a través de bancos digitales nacionales o nombrando a un representante legal. Transfiera el monto total equivalente a al menos 1 año de ingresos (mínimo de €11.040 a €15.000+ por persona) a la cuenta portuguesa antes de solicitar la visa: ¡este saldo es el principal secreto de aprobación!"
            },
            {
                docName: "🏠 Comprobante de Alojamiento de Larga Duración",
                accepted: "Contrato de arrendamiento firmado por un plazo igual o superior a 1 año (registrado en Finanzas), escritura de compra de vivienda en Portugal, o Declaración de Responsabilidad firmada por un ciudadano o residente legal.",
                where: "Propietario del inmueble o familiar/amigo residente legal en Portugal.",
                hack: "Evite presentar reservas temporales de hoteles o Booking de corto plazo (como 15 o 30 días), ya que el consulado suele rechazarlas. Si no tiene un contrato de alquiler, pídale a un amigo o familiar residente legal que firme una Declaración de Alojamiento."
            },
            {
                docName: "🏥 Seguro de Salud Internacional o PB4",
                accepted: "Póliza de seguro de salud privado con cobertura médica mínima de €30.000 (incluyendo repatriación), o documento de acuerdo bilateral de salud activo.",
                where: "Aseguradoras privadas internacionales o Ministerio de Salud del país de origen.",
                hack: "Si tiene nacionalidad brasileña, puede solicitar gratuitamente el formulario PB4 en línea. ¡El PB4 reemplaza por completo el requisito de un costoso seguro de salud privado tanto en el consulado como en AIMA!"
            }
        ],
        visa_d4: [
            {
                docName: "🎓 Matrícula o Carta de Aceptación",
                accepted: "Documento oficial de aceptación emitido por una universidad, politécnico o escuela secundaria en Portugal.",
                where: "Oficina de registro de la institución educativa portuguesa.",
                hack: "Verifique si la institución de educación superior está reconocida por la DGES. Para visas de larga duración, el curso debe otorgar un título académico o ser equivalente. Los estudiantes tienen derecho legal a trabajar por cuenta ajena o propia (Art. 97 de la Ley 23/2007)."
            },
            {
                docName: "💰 Prueba de Medios de Subsistencia",
                accepted: "Extracto bancario que demuestre la posesión de fondos para el año escolar, comprobante de beca o una Declaración de Responsabilidad firmada por un ciudadano/residente en Portugal.",
                where: "Bancos o declaración firmada por el familiar/patrocinador.",
                hack: "Si tiene una beca oficial o un contrato de prácticas remuneradas, estos documentos eximen de la necesidad de demostrar saldos bancarios elevados."
            }
        ],
        visa_job_search: [
            {
                docName: "📋 Declaración de Registro en el IEFP",
                accepted: "Comprobante oficial en PDF de registro de candidatura a empleo con un código QR válido.",
                where: "Portal en línea del IEFP (Instituto de Empleo y Formación Profesional).",
                hack: "Debe realizar este registro en línea ANTES de ir al Consulado a solicitar la visa. Es gratuito y el PDF se genera instantáneamente en el perfil tras completar los datos."
            },
            {
                docName: "💰 Medios Mínimos de Subsistencia",
                accepted: "Extracto bancario personal que demuestre el equivalente a al menos 3 veces el salario mínimo nacional neto (3 x 920€ = €2.760).",
                where: "Extractos bancarios oficiales sellados por su banco.",
                hack: "Este requisito de saldo bancario puede eximirse al 100% si un ciudadano portugués o un extranjero residente legal en Portugal firma una Declaración de Responsabilidad oficial garantizando su manutención y alojamiento."
            }
        ],
        art122: [
            {
                docName: "👥 Pruebas de Vínculo Familiar",
                accepted: "Certificado de Matrimonio, certificados de nacimiento de los hijos o declaración oficial de unión de hecho estable.",
                where: "Registro Civil del país de origen (deben estar Apostillados o legalizados por el Consulado Portugués).",
                hack: "Cualquier documento expedido en un idioma extranjero debe traducirse al portugués y la traducción debe ser certificada (por notario, abogado portugués o Consulado) para ser aceptada por AIMA."
            }
        ],
        family: [
            {
                docName: "👨‍👩‍👧 Certificados Civiles y Parentesco",
                accepted: "Certificado de Matrimonio, certificados de nacimiento de los hijos o documento de unión de hecho formalizada.",
                where: "Registro Civil del país de origen (obligatoriamente Apostillados de La Haya o legalizados por el Consulado de Portugal).",
                hack: "Todos los certificados extranjeros deben ser de emisión reciente (idealmente menos de 6 meses), estar apostillados de La Haya en el país de origen y acompañados de traducción jurada al portugués."
            },
            {
                docName: "💰 Prueba de Medios de Subsistencia Familiares",
                accepted: "Nóminas de los últimos 3 meses, Declaración de la Renta (IRS) o extracto bancario con saldo anual familiar (Orden 1563/2007: 100% titular 920€/mes + 50% cónyuge 460€/mes + 30% por hijo 276€/mes).",
                where: "Empresa empleadora en Portugal, Hacienda (Finanças) o banco en Portugal.",
                hack: "La subsistencia se calcula anualmente. Para reagrupar al cónyuge y 1 hijo menor, debe acreditar ingresos mensuales estables de al menos €1.656 (o saldo equivalente anual de €19.872)."
            },
            {
                docName: "🏠 Comprobante de Alojamiento Adecuado",
                accepted: "Contrato de alquiler registrado en Hacienda (AT) con recibos electrónicos de renta, escritura pública o certificado de la Junta de Freguesia.",
                where: "Portal das Finanças (arrendador), Registro de la Propiedad o Junta de Freguesia.",
                hack: "AIMA exige que la vivienda tenga capacidad suficiente para el tamaño de la familia reagrupada. Asegúrese de que el contrato esté activo y a su nombre."
            },
            {
                docName: "🏛️ Título de Residencia del Titular y Antecedentes Penales",
                accepted: "Autorización de Residencia válida del solicitante en Portugal y Certificado de Antecedentes Penales de los familiares mayores de 16 años.",
                where: "AIMA (Título del residente) e Ministerio de Justicia / Policía del país de origen (Apostillado de La Haya).",
                hack: "Si los familiares están fuera de Portugal, tras la aprobación o para viajar, se tramita el Visado D6 de Reagrupación Familiar en el Consulado de Portugal."
            }
        ],
        via_verde: [
            {
                docName: "💼 Promesa o Contrato de Trabajo de la Empresa",
                accepted: "Contrato de trabajo formal o Promesa vinculante con empresa radicada en Portugal o empresa con certificación Tech Visa.",
                where: "Empresa empleadora en Portugal.",
                hack: "La empresa debe emitir la Declaración de Responsabilidad corporativa y registrar la vacante en el IEFP o contar con Tech Visa (IAPMEI)."
            },
            {
                docName: "📄 Declaración de Responsabilidad Empresarial",
                accepted: "Declaración de responsabilidad firmada por la empresa cubriendo alojamiento, gastos de manutención y repatriación si fuere necesario.",
                where: "Firmada por gerencia/RRHH de la empresa en Portugal.",
                hack: "La Declaración de Responsabilidad empresarial exime de la necesidad de saldos personales elevados en el consulado."
            }
        ],
        asylum: [
            {
                docName: "🛡️ Solicitud de Protección Internacional (Asilo)",
                accepted: "Declaración formal de solicitud de asilo presentada ante la Policía (PSP), GNR o directamente ante AIMA / CPR.",
                where: "Puesto fronterizo, comisaría de policía o Consejo Portugués para los Refugiados (CPR).",
                hack: "La solicitud de asilo suspende de inmediato cualquier proceso de expulsión y otorga derecho a la Declaración de Asilo y asistencia jurídica gratuita."
            },
            {
                docName: "📄 Comprobante de Residencia y Apoyo Social",
                accepted: "Comprobante de domicilio o certificado de acogida emitido por centro de acogida humanitaria (CPR/Cruz Roja/SCML).",
                where: "Entidades de acogida o Junta de Freguesia.",
                hack: "Los solicitantes de asilo tienen derecho completo a la sanidad pública (SNS) y a la Autorización de Residencia Provisional."
            }
        ],
        voluntary_return: [
            {
                docName: "✈️ 1. Inscripción en el Programa ARVoRe VIII (OIM / AIMA)",
                accepted: "Inscripción formal presentada en línea en retornovoluntario.pt, por correo electrónico (arvore@iom.int / retornovoluntario@iom.int) o presencialmente en centros CNAIM.",
                where: "Oficina de la OIM Portugal (Lisboa / Tel: 808 257 257 o +351 21 324 2940) o delegaciones de AIMA / CNAIM.",
                hack: "El trámite es 100% gratuito, confidencial y digno. La OIM no comparte datos con fines punitivos. Cualquier extranjero sin recursos suficientes puede solicitarlo."
            },
            {
                docName: "🛂 2. Pasaporte Nacional o Salvoconducto Consular",
                accepted: "Pasaporte válido o caducado del país de origen, O Salvoconducto / Título de Viaje de Emergencia emitido por el Consulado en Portugal.",
                where: "Consulado o Embajada del país de origen en Lisboa u Oporto.",
                hack: "Si su pasaporte está extraviado, retenido o vencido, la OIM coordina directamente con su consulado y apoya en el pago de tasas de emisión."
            },
            {
                docName: "🎫 3. Billete de Avión y Asistencia en el Aeropuerto",
                accepted: "Billete de avión internacional cubierto al 100% por la OIM hasta el aeropuerto más cercano a su destino, con equipaje de bodega incluido.",
                where: "Gestionado y emitido directamente por la OIM Portugal.",
                hack: "Personas en situación de vulnerabilidad de salud, embarazadas o familias con niños disponen de acompañamiento presencial en el aeropuerto hasta el embarque."
            },
            {
                docName: "💼 4. Ayuda de Reintegración y Apoyo a Micro-Negocios",
                accepted: "Plan de reintegración socioeconómica aprobado para concesión de ayuda financiera tras la llegada (compra de herramientas de trabajo o formación).",
                where: "Oficinas locales de la OIM y ONG colaboradoras en el país de destino.",
                hack: "La ayuda tras la llegada se destina a la compra directa de equipos de trabajo o cursos para garantizar la estabilidad económica de la familia."
            }
        ]
    },
    fr: {
        art88: [
            {
                docName: "📋 Contrat ou Promesse de Travail",
                accepted: "Contrat de travail écrit signé conformément au droit du travail portugais, ou Promesse écrite de contrat de travail détaillant les fonctions, les horaires et le salaire.",
                where: "Fourni par l'employeur (entreprise) au Portugal.",
                hack: "Le contrat doit être enregistré auprès de l'Administration Fiscale (AT) et de la Sécurité Sociale par l'employeur. Assurez-vous que le salaire proposé est égal ou supérieur au Salaire Minimum National (SMN) pour éviter un rejet automatique."
            },
            {
                docName: "✈️ Visa de Résidence Consulaire Valide (Art. 88, al. 1)",
                accepted: "Visa de résidence consulaire préalable pour l'exercice d'une activité salariée apposé sur le passeport (délivré dans le pays d'origine avant le voyage).",
                where: "Poste Consulaire / Ambassade du Portugal dans le pays d'origine ou de résidence habituelle.",
                hack: "Avertissement : Le décret-loi n.º 37-A/2024 a abrogé les anciennes Manifestations d'Intérêt. L'entrée en tant que touriste ne permet plus la régularisation par le travail ; il est obligatoire d'obtenir un visa consulaire de résidence ou de recherche d'emploi avant de voyager."
            },
            {
                docName: "💳 NIF et NISS actifs (Obtention préalable ou sur place)",
                accepted: "Document officiel du Numéro d'Identification Fiscale (NIF) avec adresse mise à jour et Numéro d'Identification de la Sécurité Sociale (NISS).",
                where: "Administration Fiscale (AT - Finanças) et Institut de la Sécurité Sociale (ISS).",
                hack: "Canaux Officiels Avant l'Arrivée : Les consulats portugais ne délivrent pas de NIF ni de NISS en règle générale. Pour obtenir un NIF avant d'arriver au Portugal, la demande est soumise à l'AT (e-Balcão ou bureau fiscal) par un représentant légal/mandataire muni d'une procuration et d'un passeport (le mandataire pour la demande de NIF est distinct du représentant fiscal). Le NISS avant l'arrivée peut être demandé en ligne auprès de la Sécurité Sociale par un représentant légal ou par l'employeur sur présentation d'un contrat/promesse d'embauche. Après l'arrivée, le NISS peut être obtenu en personne via le guichet 'NISS na Hora'."
            }
        ],
        art89: [
            {
                docName: "📋 Déclaration de Début d'Activité (Fiscalité & Sécurité Sociale)",
                accepted: "Preuve officielle d'ouverture d'activité auprès de Finanças avec un code CAE (Activité Économique) ou un code IRS valide.",
                where: "Portal das Finanças (en ligne) ou au guichet d'un bureau de fiscalité local.",
                hack: "Début et Cessation d'Activité (Cadre Légal) : La déclaration de début d'activité doit être déposée auprès des Finanças AVANT de commencer toute opération (Art. 112, n.º 1 CIRS). L'AT informe d'office la Sécurité Sociale (Art. 143 CRCSPSS), qui procède automatiquement à l'affiliation (Art. 144) — aucune démarche manuelle sous 30 jours n'est exigée envers la SS ! L'affiliation normale prend effet le 1er jour du 12e mois (Art. 145), le travailleur pouvant demander une prise d'effet anticipée via la déclaration trimestrielle (Art. 146). En cas d'arrêt, la cessation doit être déclarée aux Finanças dans les 30 jours (Art. 33 CIVA et Art. 112, n.º 4 CIRS) ; la SS clôture d'office l'affiliation (Art. 147, n.º 2) avec effet le 1er jour du mois suivant (Art. 148)."
            },
            {
                docName: "📄 Contrat de Prestation de Services",
                accepted: "Contrat écrit de prestation de services avec des clients ou factures-reçus électroniques (Recibos Verdes) émis au cours des derniers mois.",
                where: "Signé entre vous et le client (entreprise ou particulier).",
                hack: "Le fait de disposer d'au moins un contrat de services à moyen ou long terme avec une entreprise nationale ou internationale augmente considérablement le taux d'approbation de votre demande auprès de l'AIMA."
            }
        ],
        art90a: [
            {
                docName: "💰 Preuve de Revenus Moyens (Nomade Digital)",
                accepted: "Relevés bancaires tamponnés des 3 derniers mois et déclarations fiscales prouvant un revenu mensuel moyen supérieur à 4 salaires minimums (4 x 920€ = €3.680/mois).",
                where: "Banques (relevés originaux) et l'Administration Fiscale de votre pays d'origine.",
                hack: "Les revenus doivent provenir de l'extérieur du Portugal. L'AIMA exige une preuve de relation de travail (contrat à distance ou contrat de prestation actif avec des entités étrangères)."
            },
            {
                docName: "🇵🇹 NIF et Compte Bancaire Portugais",
                accepted: "NIF portugais actif et relevé de compte d'une banque basée au Portugal.",
                where: "Portal das Finanças (NIF) et agence physique ou en ligne d'une banque portugaise.",
                hack: "Vous pouvez ouvrir le compte bancaire portugais en ligne avant de voyager (via les banques digitales nationales ou des avocats disposant d'une procuration)."
            }
        ],
        visa_d7: [
            {
                docName: "📈 Preuve de Revenus Passifs (Retraite ou autres)",
                accepted: "Déclaration officielle de l'organisme de retraite (Sécurité Sociale ou équivalent), contrats de bail enregistrés avec justificatifs de loyer, dividendes ou investissements financiers stables dépassant le salaire minimum net portugais (920€/mois ou 11.040€/an).",
                where: "Caisse de retraite du pays d'origine, banques ou registre foncier.",
                hack: "La loi portugaise exige un revenu passif mensuel minimum garanti équivalent au salaire minimum national (920€). Ajoutez 50 % (460€) pour le conjoint et 30 % (276€) par enfant à charge. Veillez à faire apostiller/légaliser et traduire officiellement toutes les déclarations étrangères."
            },
            {
                docName: "🇵🇹 NIF et Compte Bancaire au Portugal avec Fonds",
                accepted: "Document officiel du NIF portugais et relevé de compte officiel d'une banque basée au Portugal montrant les fonds déposés.",
                where: "Autorité fiscale (Finanças) et toute institution bancaire basée au Portugal.",
                hack: "Ouvrez votre compte bancaire portugais 100 % à distance via des banques en ligne nationales ou par procuration à un avocat. Transférez le montant équivalent à au moins 1 an de revenus (minimum 11.040 € à 15.000 €+ par personne) sur le compte portugais avant le dépôt du visa : ce solde est le secret d'approbation principal !"
            },
            {
                docName: "🏠 Justificatif d'Hébergement Longue Durée",
                accepted: "Contrat de location signé pour une durée d'un an ou plus (enregistré auprès du fisc portugais), acte d'achat de propriété au Portugal, ou attestation de prise en charge/hébergement signée par un citoyen ou résident légal.",
                where: "Propriétaire du bien (bailleur) ou proche/ami résident légal au Portugal.",
                hack: "Évitez les réservations d'hôtel temporaires de courte durée (comme 15 ou 30 jours), le consulat les rejetant souvent. Si vous n'avez pas encore de contrat de bail, demandez à un résident légal de signer une attestation d'hébergement accompagnée du titre de propriété."
            },
            {
                docName: "🏥 Assurance Santé Internationale ou Accord PB4",
                accepted: "Police d'assurance santé privée avec couverture médicale minimale de 30 000 € (rapatriement inclus), ou accord bilatéral de santé actif.",
                where: "Compagnies d'assurance privées internationales ou ministère de la Santé du pays d'origine.",
                hack: "Si vous êtes ressortissant brésilien, vous pouvez demander le formulaire PB4 (CDAM) en ligne gratuitement sous 3 jours. Le PB4 remplace intégralement l'obligation d'une assurance santé privée coûteuse au consulat et à l'AIMA !"
            }
        ],
        visa_d4: [
            {
                docName: "🎓 Inscription ou Lettre d'Acceptation",
                accepted: "Document officiel d'acceptation délivré par une université, un institut polytechnique ou une école secondaire au Portugal.",
                where: "Bureau d'inscription de l'établissement d'enseignement portugais.",
                hack: "Vérifiez si l'établissement d'enseignement supérieur est reconnu par la DGES. Pour les visas de longue durée, le cours doit délivrer un diplôme académique ou être équivalent. Les étudiants ont le droit légal de travailler sous contrat ou comme indépendants (Art. 97 de la Loi 23/2007)."
            },
            {
                docName: "💰 Preuve de Moyens de Subsistance",
                accepted: "Relevé bancaire prouvant la possession de fonds pour l'année scolaire, preuve de bourse ou Déclaration de Prise en Charge signée par un citoyen/résident au Portugal.",
                where: "Banques ou déclaration signée par le parent/garant.",
                hack: "Si vous disposez d'une bourse d'études officielle ou d'un contrat de stage rémunéré, ces documents dispensent de l'obligation de prouver des soldes bancaires élevés."
            }
        ],
        visa_job_search: [
            {
                docName: "📋 Déclaration d'Enregistrement auprès de l'IEFP",
                accepted: "Preuve officielle en PDF d'enregistrement de recherche d'emploi avec un code QR valide.",
                where: "Portail en ligne de l'IEFP (Institut de l'Emploi et de la Formation Professionnelle).",
                hack: "Vous devez vous inscrire en ligne AVANT de vous rendre au Consulat pour demander le visa. C'est gratuit et le PDF est généré instantanément dans le profil après avoir rempli les détails."
            },
            {
                docName: "💰 Moyens de Subsistance Minimaux",
                accepted: "Relevé bancaire personnel indiquant l'équivalent d'au moins 3 fois le salaire minimum national net (3 x 920€ = €2.760).",
                where: "Relevés bancaires officiels tamponnés par votre banque.",
                hack: "Cette exigence de solde bancaire peut être annulée à 100% si un citoyen portugais ou un étranger résident légal au Portugal signe une Déclaration de Prise en Charge officielle garantissant votre subsistance et votre logement."
            }
        ],
        art122: [
            {
                docName: "👥 Preuve de Lien Familial",
                accepted: "Acte de Mariage, actes de naissance des enfants ou déclaration officielle d'union stable de fait.",
                where: "Registre d'état civil du pays d'origine (doivent obligatoirement être Apostillés ou légalisés par le Consulat Portugais).",
                hack: "Tout document rédigé dans une langue étrangère doit être traduit en portugais, et la traduction doit être certifiée (par un notaire, un avocat portugais ou le Consulat) pour être acceptée par l'AIMA."
            }
        ],
        family: [
            {
                docName: "👨‍👩‍👧 Actes d'État Civil & Lien de Parenté",
                accepted: "Acte de Mariage, actes de naissance des enfants ou certificat d'union de fait officiellement reconnue.",
                where: "Registre d'état civil du pays d'origine (obligatoirement Apostillés de La Haye ou légalisés par le Consulat Portugais).",
                hack: "Tous les actes étrangers doivent être de délivrance récente (idéalement moins de 6 mois), apostillés de La Haye dans le pays d'origine et accompagnés d'une traduction certifiée en portugais."
            },
            {
                docName: "💰 Preuve de Moyens de Subsistance Familiaux",
                accepted: "Bulletins de salaire des 3 derniers mois, Déclaration d'Impôt (IRS) ou relevé bancaire avec solde annuel familial (Arrêté 1563/2007 : 100% demandeur 920€/mois + 50% conjoint 460€/mois + 30% par enfant 276€/mois).",
                where: "Employeur au Portugal, Administration Fiscale (Finanças) ou banque au Portugal.",
                hack: "La subsistance est calculée annuellement. Pour regrouper un conjoint et 1 enfant mineur, vous devez justifier d'un revenu mensuel stable d'au moins €1.656 (ou un solde annuel cumulé de €19.872)."
            },
            {
                docName: "🏠 Preuve de Logement Décent",
                accepted: "Contrat de bail enregistré aux Finances (AT) avec quittances électroniques de loyer, acte de propriété ou certificat de la Junta de Freguesia.",
                where: "Portail des Finances (propriétaire), Conservation Foncière ou Junta de Freguesia.",
                hack: "L'AIMA exige que le logement ait une capacité suffisante pour la taille du foyer regroupé. Assurez-vous que le contrat de bail est actif et à votre nom."
            },
            {
                docName: "🏛️ Titre de Séjour du Demandeur & Casier Judiciaire",
                accepted: "Titre de séjour valide du demandeur au Portugal et Casier Judiciaire du pays d'origine de tous les membres de la famille âgés de 16 ans et plus.",
                where: "AIMA (Titre du résident) et Ministère de la Justice / Police du pays d'origine (Apostillé de La Haye).",
                hack: "Si les proches sont hors du Portugal, après approbation ou pour voyager, le Visa D6 de Regroupement Familial doit être demandé au Consulat du Portugal."
            }
        ],
        via_verde: [
            {
                docName: "💼 Promesse ou Contrat de Travail de l'Entreprise",
                accepted: "Contrat de travail formel ou Promesse d'embauche avec une entreprise basée au Portugal ou certifiée Tech Visa.",
                where: "Entreprise employeur au Portugal.",
                hack: "L'entreprise doit émettre la Déclaration de Responsabilité et enregistrer l'offre auprès de l'IEFP ou disposer de la certification Tech Visa (IAPMEI)."
            },
            {
                docName: "📄 Déclaration de Responsabilité d'Entreprise",
                accepted: "Déclaration de responsabilité signée par l'entreprise couvrant le logement, les frais de subsistance et le rapatriement si nécessaire.",
                where: "Signée par la direction / RH de l'entreprise au Portugal.",
                hack: "La Déclaration de Responsabilité d'entreprise remplace l'obligation de justifier de soldes bancaires personnels élevés au consulat."
            }
        ],
        asylum: [
            {
                docName: "🛡️ Demande de Protection Internationale (Asile)",
                accepted: "Déclaration formelle de demande d'asile présentée à la Police (PSP), GNR ou directement à l'AIMA / CPR.",
                where: "Poste frontière, commissariat de police ou Conseil Portugais pour les Réfugiés (CPR).",
                hack: "Le dépôt de la demande d'asile suspend immédiatement toute procédure d'expulsion et donne droit à l'Attestation de Demande d'Asile et à l'assistance du CPR."
            },
            {
                docName: "📄 Justificatif de Domicile et Soutien Social",
                accepted: "Preuve d'adresse ou attestation d'hébergement délivrée par un centre d'accueil humanitaire (CPR / Croix-Rouge / SCML).",
                where: "Organismes d'accueil social ou Junta de Freguesia.",
                hack: "Les demandeurs d'asile ont un accès complet aux soins médicaux du SNS et reçoivent un Titre de Séjour Provisoire après admission."
            }
        ],
                voluntary_return: [
            {
                docName: "✈️ 1. Inscription au Programme ARVoRe VIII (OIM / AIMA)",
                accepted: "Inscription officielle soumise en ligne sur retornovoluntario.pt, par e-mail (arvore@iom.int / retornovoluntario@iom.int) ou aux guichets CNAIM / CLAIM.",
                where: "Bureau de l'OIM Portugal (Lisbonne : Rua José Estêvão, 137 / Tél : 808 257 257 ou +351 21 324 2940) ou centres officiels AIMA / CNAIM.",
                hack: "La démarche est 100% gratuite, confidentielle et sécurisée. L'OIM ne transmet pas de données à la police à des fins punitives. Tout ressortissant étranger sans moyens financiers peut postuler."
            },
            {
                docName: "🛂 2. Passeport National ou Laissez-Passer Consulaire",
                accepted: "Passeport valide ou expiré du pays d'origine, OU Laissez-passer / Titre de voyage d'urgence délivré par le Consulat ou l'Ambassade au Portugal.",
                where: "Consulat ou Ambassade du pays d'origine à Lisbonne ou Porto.",
                hack: "En cas de passeport perdu, retenu ou expiré, l'équipe de l'OIM assiste directement auprès du consulat et prend en charge les frais d'émission du document de voyage."
            },
            {
                docName: "🎫 3. Billet d'Avion & Assistance à l'Aéroport",
                accepted: "Billet d'avion international pris en charge à 100% par l'OIM jusqu'à l'aéroport le plus proche du domicile dans le pays d'origine, bagage en soute inclus.",
                where: "Géré et émis directement par l'OIM Portugal en coordination avec les compagnies aériennes.",
                hack: "Les personnes vulnérables, femmes enceintes, seniors et familles avec enfants bénéficient d'un accompagnement personnalisé aux aéroports de Lisbonne ou Porto jusqu'à l'embarquement."
            },
            {
                docName: "💼 4. Allocation de Réinstallation & Soutien de Projet",
                accepted: "Plan de réintégration socio-économique validé pour le soutien financier post-arrivée (achat d'outils, d'équipements de travail ou formation professionnelle).",
                where: "Bureaux locaux de l'OIM et partenaires dans le pays de retour.",
                hack: "L'allocation post-arrivée est investie dans du matériel professionnel et des projets concrets pour assurer l'autonomie durable du foyer."
            }
        ]
    }
};
