DApp = {
	
	factoryContract: null,
	factoryAbi: [{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"label","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setSubnodeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}],
	emptyAddress: '0x0000000000000000000000000000000000000000',

	// Local
	//factoryAddress: "0x9fbda871d559710256a2502a2517b794b482db40",

	// Mainnet
    factoryAddress: "0xA202F2D44302CC0e68Ee7E230C0E038b96ABC96B",

	init: function() {
		console.log('[x] Initializing DApp.');
		this.initWeb3();
	},
	

	initWeb3: function() {
		window.addEventListener('load', async () => {
                // Modern dapp browsers...
                if (window.ethereum) {
                    window.web3 = new Web3(ethereum);
                    try {
                        // Request account access if needed
                        await ethereum.enable();
                        // Acccounts now exposed
                        OnCheckingDone();
                    } 
                    catch (error) {
                        OnError("User denied access to Metamask for this app");
                    }
                }
                // Legacy dapp browsers...
                else if (window.web3) {
                    window.web3 = new Web3(web3.currentProvider);
                    // Acccounts always exposed
                    OnCheckingDone();
                }
                // Non-dapp browsers...
                else {
                    OnError('Non-Ethereum browser detected. You should consider trying MetaMask!');
                }
        });
          	function OnCheckingDone()
    	{
    		if(typeof(window.web3.eth.accounts[0]) == 'undefined')
    		{
    			OnError("Please log into Metamask to access the Registrar.");
    		}
    	}
    	function OnError(message)
    	{
            document.getElementById("web3Error").style.visibility = "visible";
    	}},

	initContracts: function() {
		DApp.factoryContract = new web3.eth.Contract(DApp.factoryAbi, DApp.factoryAddress);
		console.log('[x] Factory contract initialized.');

		DApp.loadAccount();
	},

	loadAccount: function() {
		web3.eth.getAccounts(function(error, accounts) {
			if(error) {
				console.error("[x] Error loading accounts", error);
			} else {
				DApp.currentAccount = accounts[0];
				console.log("[x] Using account", DApp.currentAccount);

				DApp.initActions();
				DApp.initFrontend();
			}
		});
	},

	checkSubdomainOwner: function(subdomain, domain, topdomain){
		DApp.factoryContract.methods.subdomainOwner(subdomain, domain, topdomain).call(
				function(error, addr){
				if(error){
					console.log('[x] Error during execution', error);
				} else {
					$("#subdomain").removeClass("is-valid is-invalid");
					if(addr === DApp.emptyAddress){
						$('#valid').text("It's available! Go for it tiger!");
						$('#subdomain').addClass('is-valid');
					} else if(addr === DApp.currentAccount) {
						$('#valid').text("It's your subdomain! Edit away!");
						$('#subdomain').addClass('is-valid');
					} else {
						$('#invalid').text("Oops! It's already taken by: " + addr);
						$('#subdomain').addClass('is-invalid');
					}
				}
			})
	},

	newSubdomain: function(subdomain, domain, topdomain, owner, target) {
		DApp.factoryContract.methods.newSubdomain(
			subdomain, domain, topdomain, owner, target).send(
			{
				gas: 150000,
				from: DApp.currentAccount
			},
			function(error, result){
				if(error){
					console.log('[x] Error during execution', error);
				} else {
					console.log('[x] Result', result);
				}
			})
	},

	initActions: function() {
		$("#domain").on("change", function() {
			DApp.updateDomainAvailable();
		});

		$("#subdomain").on("paste keyup", function() {
			DApp.updateDomainAvailable();
		});

		$("#owner").on("paste keyup", function() {
			$("ownerHelp").remove();
			DApp.validateAddress("#owner");
		});

		$("#target").on("paste keyup", function() {
			$("targetHelp").remove();
			DApp.validateAddress("#target");
		});

		$("#subdomain-form").submit(function(event) {
			event.preventDefault();
			$("#ownerHelp").remove();
			$("#targetHelp").remove();

			let fullDomain = $('#subdomain').val() + "." +
				$('#domain option').filter(":selected").val() + "." +
                $('#topdomain option').filter(":selected").val();
			$("a").attr("href", "https://etherscan.io/enslookup?q=" + fullDomain);
			$('#confirmModal').modal('show');
			$("#subdomain").removeClass("is-valid is-invalid");

			DApp.newSubdomain(
				$('#subdomain').val(),
				$('#domain option').filter(":selected").val(),
				$('#owner').val(),
				$('#target').val()
			);
		});
	},

	validateAddress: function(element){
		if(web3.utils.isAddress($(element).val())){
			$(element).removeClass("is-invalid");
		} else {
			$(element).addClass("is-invalid");
		}
	},

	initFrontend: function(){
		$('#owner').val(DApp.currentAccount);
		$('#target').val(DApp.currentAccount);
		$("#domain").append("<option value='freedomain'>freedomain</option>");
        $("#topdomain").append("<option value='eth'>eth</option>");
	},

	updateDomainAvailable: function(){
		$("#subdomain").removeClass("is-valid is-invalid");
		let cleaned = $('#subdomain').val().replace(/[^a-z0-9]/gi,'').toLowerCase();
		$('#subdomain').val(cleaned);
		if($('#subdomain').val().length > 0) {
			DApp.checkSubdomainOwner(
				$('#subdomain').val(),
				$('#domain option').filter(":selected").val()
				);
		}
	}
}

$(function() {
	DApp.init();
});