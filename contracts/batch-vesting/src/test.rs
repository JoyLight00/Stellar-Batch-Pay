#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, Vec,
};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_id = env.register_stellar_asset_contract(admin.clone());
    (
        TokenClient::new(env, &contract_id),
        TokenAdminClient::new(env, &contract_id),
    )
}

#[test]
fn test_deposit_and_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [100, 200]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    assert_eq!(token.balance(&sender), 700);
    assert_eq!(token.balance(&contract_id), 300);

    env.ledger().with_mut(|li| {
        li.timestamp = 1001;
    });

    client.claim(&recipient1, &token.address);
    assert_eq!(token.balance(&recipient1), 100);
    assert_eq!(token.balance(&contract_id), 200);

    client.claim(&recipient2, &token.address);
    assert_eq!(token.balance(&recipient2), 200);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "Vesting is currently locked")]
fn test_claim_too_early() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    // Try to claim before unlock_time
    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.claim(&recipient1, &token.address);
}

#[test]
#[should_panic]
fn test_claim_unauthorized() {
    let env = Env::default();
    // NOT calling env.mock_all_auths() here
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    // This should fail because recipient hasn't authorized the call
    client.claim(&recipient, &token);
}

#[test]
#[should_panic(expected = "No vesting found for recipient")]
fn test_claim_no_vesting() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.claim(&recipient, &token);
}

#[test]
#[should_panic]
fn test_deposit_unauthorized() {
    let env = Env::default();
    // NOT calling env.mock_all_auths() here
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let token = Address::generate(&env);
    let recipients = Vec::from_array(&env, [Address::generate(&env)]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    // This should fail because sender hasn't authorized the call
    client.deposit(&sender, &token, &recipients, &amounts, &unlock_time);
}
