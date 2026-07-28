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
                docName: "✈️ Declaração de Entrada Legal",
                accepted: "Passaporte válido com carimbo de entrada das autoridades portuguesas, ou comprovativo de Declaração de Entrada apresentado à AIMA.",
                where: "AIMA online ou Loja do Cidadão no prazo de 3 dias úteis após entrar no país (se a entrada ocorreu via outro Estado-Membro da UE).",
                hack: "Se pernoitar num hotel, hostel ou alojamento local legal em Portugal nas primeiras 3 noites, a entidade reporta automaticamente a sua entrada ao SEF/AIMA. Guarde a fatura com o seu nome; serve como prova de entrada legal!"
            },
            {
                docName: "💳 NIF e NISS ativos",
                accepted: "Documento oficial do Número de Identificação Fiscal (NIF) com morada atualizada e Número de Identificação de Segurança Social (NISS).",
                where: "Autoridade Tributária (Finanças) e Segurança Social.",
                hack: "Se tiver um contrato de trabalho, o empregador pode requerer o seu NISS online na hora. Se for promessa, pode requerer você mesmo no portal Segurança Social Direta anexando o documento."
            }
        ],
        art89: [
            {
                docName: "📋 Declaração de Início de Atividade",
                accepted: "Comprovativo oficial de abertura de atividade nas Finanças com CAE (Atividade Económica) ou código de IRS válido.",
                where: "Portal das Finanças (online) ou balcão de um Serviço de Finanças.",
                hack: "Pode abrir atividade 100% online se tiver a senha do Portal das Finanças. Certifique-se de escolher uma CAE compatível com os serviços de prestação que vai faturar."
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
                accepted: "Extratos bancários carimbados dos últimos 3 meses e declarações de rendimentos fiscais provando rendimento mensal médio superior a 4 salários mínimos (aprox. €3.500+ a €3.800+).",
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
                accepted: "Declaração oficial da entidade de pensões (INSS ou equivalente), contratos de arrendamento registados com comprovativos de recebimento, dividendos ou aplicações financeiras de valor estável superior ao salário mínimo líquido anual português.",
                where: "Segurança Social ou Instituto de Pensões do país de origem, bancos ou registo predial.",
                hack: "A lei portuguesa exige um mínimo de rendimento passivo mensal garantido equivalente ao salário mínimo nacional (SMN). Para o cônjuge, adicione 50%, e para cada filho, 30%. Certifique-se de apostilar/legalizar e traduzir oficialmente todas as declarações estrangeiras."
            },
            {
                docName: "🇵🇹 NIF e Conta Bancária em Portugal com Fundos",
                accepted: "Documento oficial do NIF português (com morada atualizada ou representação fiscal) e extrato oficial da conta bancária em Portugal com os saldos demonstrativos.",
                where: "Autoridade Tributária (Finanças) e qualquer instituição bancária sediada em Portugal.",
                hack: "Abra a sua conta bancária portuguesa de forma 100% remota através de bancos digitais nacionais ou nomeando um procurador legal (advogado). Transfira o montante total equivalente a pelo menos 1 ano de rendimentos (mínimo de €10.500 a €15.000+ por pessoa) para a conta portuguesa antes de submeter o visto no consulado: este saldo líquido depositado em Portugal é o principal segredo de aprovação do visto D7!"
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
                hack: "Verifique se a instituição de ensino superior é reconhecida pela DGES. Para vistos de longa duração, o curso tem de conferir grau académico ou ser equivalente."
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
                accepted: "Extrato bancário pessoal mostrando o equivalente a pelo menos 3 vezes o salário mínimo nacional líquido (aprox. €2.600+).",
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
                docName: "✈️ Legal Entry Proof",
                accepted: "Valid passport with entry stamp from Portuguese authorities, or proof of Entry Declaration submitted to AIMA.",
                where: "AIMA online or Citizen Shop within 3 business days of entering the country (if entry occurred via another EU Member State with no border control).",
                hack: "If you stay in a hotel, hostel, or registered local accommodation in Portugal for the first 3 nights, the establishment automatically reports your entry to AIMA. Keep the invoice with your name; it serves as legal proof of entry!"
            },
            {
                docName: "💳 Active NIF and NISS",
                accepted: "Official document of Tax Identification Number (NIF) with updated address and Social Security Identification Number (NISS).",
                where: "Tax Authority (Finanças) and Social Security.",
                hack: "If you have an employment contract, the employer can request your NISS online instantly. For a promise of contract, you can request it yourself on the Social Security Direta portal by attaching the document."
            }
        ],
        art89: [
            {
                docName: "📋 Declaration of Start of Activity",
                accepted: "Official proof of opening of activity at Finanças with a valid CAE (Economic Activity) or IRS code.",
                where: "Portal das Finanças (online) or at a local Tax Office counter.",
                hack: "You can open your activity 100% online if you have the Portal das Finanças password. Make sure to choose a CAE compatible with the services you will bill."
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
                accepted: "Stamped bank statements of the last 3 months and tax returns proving an average monthly income higher than 4 minimum wages (approx. €3,500+ to €3,800+).",
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
                accepted: "Official pension statement (Social Security or equivalent), registered lease agreements with proof of rent receipt, dividends, or stable financial investments exceeding the annual net Portuguese minimum wage.",
                where: "Pension institution of the country of origin, banks, or land registry.",
                hack: "Portuguese law requires a minimum guaranteed monthly passive income equivalent to the national minimum wage. Add 50% for a spouse, and 30% for each dependent child. Ensure you apostille/legalize and officially translate all foreign statements."
            },
            {
                docName: "🇵🇹 NIF and Portuguese Bank Account with Funds",
                accepted: "Official Portuguese NIF document (with updated address or fiscal representation) and official bank statement from a bank in Portugal showing the deposited balance.",
                where: "Tax Authority (Finanças) and any banking institution based in Portugal.",
                hack: "Open your Portuguese bank account 100% remotely via national digital banks or by appointing a legal representative (lawyer). Transfer the total amount equivalent to at least 1 year of income (minimum €10,500 to €15,000+ per person) to the Portuguese account before applying: this liquid balance deposited in Portugal is the main secret to D7 visa approval!"
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
                hack: "Check if the higher education institution is recognized by DGES. For long-term visas, the course must award an academic degree or be equivalent."
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
                accepted: "Personal bank statement showing the equivalent of at least 3 times the net national minimum wage (approx. €2,600+).",
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
                docName: "✈️ Prueba de Entrada Legal",
                accepted: "Pasaporte válido con sello de entrada de las autoridades portuguesas, o comprobante de Declaración de Entrada presentado a AIMA.",
                where: "AIMA en línea o Loja do Cidadão dentro de los 3 días hábiles posteriores a la entrada al país (si se ingresó a través de otro Estado miembro de la UE sin control de fronteras).",
                hack: "Si se aloja en un hotel, hostal o alojamiento local registrado en Portugal las primeras 3 noches, el establecimiento informa automáticamente su entrada a AIMA. Guarde la factura a su nombre; ¡sirve como prueba legal de entrada!"
            },
            {
                docName: "💳 NIF y NISS activos",
                accepted: "Documento oficial del Número de Identificación Fiscal (NIF) con dirección actualizada y Número de Identificación de la Seguridad Social (NISS).",
                where: "Autoridad Tributaria (Finanças) y Seguridad Social.",
                hack: "Si tiene un contrato de trabajo, el empleador puede solicitar su NISS en línea al instante. Si es una promesa de contrato, puede solicitarlo usted mismo en el portal de la Seguridad Social Direta adjuntando el documento."
            }
        ],
        art89: [
            {
                docName: "📋 Declaración de Inicio de Actividad",
                accepted: "Comprobante oficial de apertura de actividad en Hacienda con CAE (Actividad Económica) o código de IRS válido.",
                where: "Portal das Finanças (en línea) o en el mostrador de una oficina de Hacienda local.",
                hack: "Puede abrir su actividad 100% en línea si tiene la contraseña del Portal das Finanças. Asegúrese de elegir una CAE compatible con los servicios que va a facturar."
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
                accepted: "Extractos bancarios sellados de los últimos 3 meses y declaraciones de impuestos que demuestren un ingreso mensual promedio superior a 4 salarios mínimos (aprox. €3.500+ a €3.800+).",
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
                accepted: "Declaración oficial de la entidad de pensiones (Seguridad Social o equivalente), contratos de alquiler registrados con recibos, dividendos o inversiones financieras estables que superen el salario mínimo líquido anual portugués.",
                where: "Institución de pensiones del país de origen, bancos o registro de la propiedad.",
                hack: "La ley portuguesa exige un ingreso pasivo mensual mínimo garantizado equivalente al salario mínimo nacional. Sume un 50% para el cónyuge y un 30% por cada hijo. Asegúrese de apostillar/legalizar y traducir oficialmente todas las declaraciones extranjeras."
            },
            {
                docName: "🇵🇹 NIF y Cuenta Bancaria en Portugal con Fondos",
                accepted: "Documento oficial del NIF portugués y extracto oficial de la cuenta bancaria en Portugal con saldos demostrativos.",
                where: "Autoridad Tributaria (Finanças) y cualquier institución bancaria con sede en Portugal.",
                hack: "Abra su cuenta bancaria portuguesa de forma 100% remota a través de bancos digitales nacionales o nombrando a un representante legal. Transfiera el monto total equivalente a al menos 1 año de ingresos (mínimo de €10.500 a €15.000+ por persona) a la cuenta portuguesa antes de solicitar la visa: ¡este saldo es el principal secreto de aprobación!"
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
                hack: "Verifique si la institución de educación superior está reconocida por la DGES. Para visas de larga duración, el curso debe otorgar un título académico o ser equivalente."
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
                accepted: "Extracto bancario personal que demuestre el equivalente a al menos 3 veces el salario mínimo nacional neto (aprox. €2.600+).",
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
                docName: "✈️ Preuve d'Entrée Légale",
                accepted: "Passeport en cours de validité avec cachet d'entrée des autorités portugaises, ou preuve de Déclaration d'Entrée soumise à l'AIMA.",
                where: "AIMA en ligne ou Loja do Cidadão dans les 3 jours ouvrables suivant l'entrée dans le pays (si l'entrée a eu lieu via un autre État membre de l'UE sans contrôle aux frontières).",
                hack: "Si vous séjournez dans un hôtel, une auberge de jeunesse ou un hébergement local enregistré au Portugal pour les 3 premières nuits, l'établissement signale automatiquement votre entrée à l'AIMA. Conservez la facture à votre nom ; elle sert de preuve légale d'entrée !"
            },
            {
                docName: "💳 NIF et NISS actifs",
                accepted: "Document officiel du Numéro d'Identification Fiscale (NIF) avec adresse mise à jour et Numéro d'Identification de la Sécurité Sociale (NISS).",
                where: "Administration Fiscale (Finanças) et Sécurité Sociale.",
                hack: "Si vous avez un contrat de travail, l'employeur peut demander votre NISS en ligne instantanément. Pour une promesse de contrat, vous pouvez en faire la demande vous-même sur le portail Segurança Social Direta en joignant le document."
            }
        ],
        art89: [
            {
                docName: "📋 Déclaration de Début d'Activité",
                accepted: "Preuve officielle d'ouverture d'activité auprès de Finanças avec un code CAE (Activité Économique) ou un code IRS valide.",
                where: "Portal das Finanças (en ligne) ou au guichet d'un bureau de fiscalité local.",
                hack: "Vous pouvez ouvrir votre activité 100% en ligne si vous avez le mot de passe du Portal das Finanças. Veillez à choisir un code CAE compatible avec les services que vous allez facturer."
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
                accepted: "Relevés bancaires tamponnés des 3 derniers mois et déclarations d'impôts prouvant un revenu mensuel moyen supérieur à 4 salaires minimums (environ €3.500+ à €3.800+).",
                where: "Banques (relevés originaux) et l'Administration Fiscale de votre pays d'origine.",
                hack: "Les revenus doivent pourvoir de l'extérieur du Portugal. L'AIMA exige une preuve de relation de travail (contrat à distance ou contrat de prestation actif avec des entités étrangères)."
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
                accepted: "Déclaration officielle de l'organisme de retraite (Sécurité Sociale ou équivalent), contrats de bail enregistrés avec justificatifs de loyer, dividendes ou investissements financiers stables dépassant le salaire minimum net portugais.",
                where: "Caisse de retraite du pays d'origine, banques ou registre foncier.",
                hack: "La loi portugaise exige un revenu passif mensuel minimum garanti équivalent au salaire minimum national. Ajoutez 50 % pour le conjoint et 30 % par enfant à charge. Veillez à faire apostiller/légaliser et traduire officiellement toutes les déclarations étrangères."
            },
            {
                docName: "🇵🇹 NIF et Compte Bancaire au Portugal avec Fonds",
                accepted: "Document officiel du NIF portugais et relevé de compte officiel d'une banque basée au Portugal montrant les fonds déposés.",
                where: "Autorité fiscale (Finanças) et toute institution bancaire basée au Portugal.",
                hack: "Ouvrez votre compte bancaire portugais 100 % à distance via des banques en ligne nationales ou par procuration à un avocat. Transférez le montant équivalent à au moins 1 an de revenus (minimum 10 500 € à 15 000 €+ par personne) sur le compte portugais avant le dépôt du visa : ce solde est le secret d'approbation principal !"
            },
            {
                docName: "🏠 Justificatif d'Hébergement Longue Durée",
                accepted: "Contrat de location signé pour une durée d'un an ou plus (enregistré auprès du fisc portugais), acte d'achat de propriété au Portugal, ou attestation de prise en charge/hébergement signée par un citoyen ou résident légal.",
                where: "Propriétaire du bien (bailleur) ou proche/ami résident légal au Portugal.",
                hack: "Évitez les réservations d'hôtel temporaires de courte durée (comme 15 ou 30 dias), le consulat les rejetant souvent. Si vous n'avez pas encore de contrat de bail, demandez à un résident légal de signer une attestation d'hébergement accompagnée du titre de propriété."
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
                hack: "Vérifiez si l'établissement d'enseignement supérieur est reconnu par la DGES. Pour les visas de longue durée, le cours doit délivrer un diplôme académique ou être équivalent."
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
                hack: "Vous devez vous inscrire en ligne AVANT de vous rendre au Consulat pour demander le visa. C'est gratuit et le PDF est généré instantanément dans le profil après avoir rempli les détails.",
            },
            {
                docName: "💰 Moyens de Subsistance Minimaux",
                accepted: "Relevé bancaire personnel indiquant l'équivalent d'au moins 3 fois le salaire minimum national net (environ €2.600+).",
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
        ]
    }
};
