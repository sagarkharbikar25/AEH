import { Tool } from './types';

export interface ConstellationInfo {
  id: string;
  name: string;
  domain: string;
  cx: number;
  cy: number;
}

export const CONSTELLATIONS: ConstellationInfo[] = [
  { id: 'calendar', name: 'Lyra', domain: 'Calendar & Scheduling', cx: 180, cy: 150 },
  { id: 'compute', name: 'Orion', domain: 'Compute & Containers', cx: 420, cy: 140 },
  { id: 'storage', name: 'Ursa', domain: 'Storage & S3 Buckets', cx: 680, cy: 130 },
  { id: 'telemetry', name: 'Cygnus', domain: 'Telemetry & Logs', cx: 880, cy: 180 },
  { id: 'workflows', name: 'Pegasus', domain: 'Workflows & State', cx: 190, cy: 350 },
  { id: 'tickets', name: 'Aquila', domain: 'Tickets & Incidents', cx: 440, cy: 340 },
  { id: 'billing', name: 'Phoenix', domain: 'Billing & Budgets', cx: 670, cy: 350 },
  { id: 'network', name: 'Draco', domain: 'Network & Routing', cx: 880, cy: 360 },
  { id: 'security', name: 'Cassiopeia', domain: 'Security & IAM Roles', cx: 170, cy: 550 },
  { id: 'messaging', name: 'Andromeda', domain: 'Messaging & Queues', cx: 400, cy: 550 },
  { id: 'database', name: 'Centaurus', domain: 'Database & SQL', cx: 630, cy: 550 },
  { id: 'devops', name: 'Vela', domain: 'DevOps & Releases', cx: 850, cy: 560 }
];

// Helper to generate jittered coords around constellation center
function cluster(cx: number, cy: number, index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI + (index % 3) * 0.4;
  const radius = 28 + (index % 5) * 12 + ((index * 7) % 20);
  return {
    x: Math.round(cx + Math.cos(angle) * radius),
    y: Math.round(cy + Math.sin(angle) * radius * 0.75)
  };
}

const CATEGORY_TOOLS_CONFIG: Record<string, string[]> = {
  calendar: [
    'create_event', 'delete_event', 'find_free_slots', 'list_attendees', 'reschedule_meeting',
    'sync_external_calendar', 'set_recurring_rule', 'get_timezone_offset', 'book_room', 'cancel_booking',
    'export_ical', 'import_calendar_feed', 'get_busy_overlay', 'suggest_agenda', 'email_invites',
    'list_calendars', 'share_calendar_permissions', 'check_conflict', 'archive_past_events', 'summarize_daily_schedule'
  ],
  compute: [
    'launch_instance', 'terminate_instance', 'resize_vm', 'list_containers', 'stop_container',
    'attach_ebs_volume', 'detach_volume', 'create_snapshot', 'get_cpu_utilization', 'set_autoscaling_group',
    'drain_node', 'reboot_instance', 'allocate_elastic_ip', 'create_ami', 'list_active_tasks',
    'deploy_lambda_function', 'invoke_lambda', 'tag_resource', 'get_instance_metadata', 'export_container_logs'
  ],
  storage: [
    'upload_object', 'download_object', 'delete_bucket', 'create_bucket', 'list_objects',
    'set_lifecycle_policy', 'enable_versioning', 'generate_presigned_url', 'replicate_cross_region', 'get_bucket_metrics',
    'encrypt_bucket', 'abort_multipart_upload', 'copy_object', 'restore_glacier_archive', 'set_cors_rules',
    'tag_bucket', 'scan_storage_classes', 'get_object_acl', 'empty_bucket', 'calculate_storage_cost'
  ],
  telemetry: [
    'query_metric_series', 'create_alarm', 'list_active_alarms', 'tail_log_group', 'filter_log_events',
    'get_trace_summary', 'sample_spans', 'register_metric_stream', 'export_dashboard_json', 'put_metric_data',
    'analyze_latency_p99', 'detect_anomalies', 'correlate_errors', 'set_alarm_action', 'delete_log_stream',
    'archive_log_group', 'get_composite_alarm', 'query_insights', 'ingest_opentelemetry', 'ping_healthcheck'
  ],
  workflows: [
    'start_execution', 'stop_execution', 'describe_state_machine', 'list_executions', 'retry_failed_step',
    'pause_workflow', 'resume_workflow', 'send_task_heartbeat', 'get_execution_history', 'validate_asl_definition',
    'trigger_eventbridge_rule', 'map_array_tasks', 'catch_state_error', 'update_workflow_definition', 'publish_event',
    'subscribe_sns_topic', 'poll_task_token', 'dispatch_webhook', 'audit_workflow_run', 'simulate_dry_run'
  ],
  tickets: [
    'open_issue', 'close_issue', 'assign_ticket', 'update_priority', 'add_comment',
    'link_related_incident', 'escalate_to_pager', 'list_unassigned_tickets', 'calculate_sla_remaining', 'merge_duplicate_tickets',
    'search_knowledge_base', 'export_ticket_pdf', 'tag_ticket_component', 'change_ticket_status', 'page_oncall_engineer',
    'acknowledge_alert', 'resolve_alert', 'schedule_oncall_rotation', 'list_incident_timeline', 'generate_postmortem_draft'
  ],
  billing: [
    'get_monthly_spend', 'forecast_end_of_month', 'create_cost_budget', 'alert_threshold_breach', 'get_service_cost_breakdown',
    'find_idle_resources', 'compare_savings_plans', 'list_invoices', 'download_cost_csv', 'apply_discount_credit',
    'get_daily_burn_rate', 'simulate_ri_purchase', 'detect_cost_spikes', 'set_spend_killswitch', 'export_billing_cur',
    'attribute_cost_by_tag', 'get_free_tier_usage', 'list_payment_methods', 'audit_unattached_disks', 'estimate_bedrock_spend'
  ],
  network: [
    'create_vpc', 'modify_route_table', 'attach_internet_gateway', 'allocate_nat_gateway', 'create_security_group',
    'authorize_ingress_rule', 'revoke_egress_rule', 'list_dns_records', 'upsert_dns_record', 'flush_dns_cache',
    'check_port_reachability', 'create_vpn_connection', 'configure_load_balancer', 'register_target_group', 'health_check_target',
    'setup_transit_gateway', 'inspect_flow_logs', 'request_acm_certificate', 'validate_domain_ownership', 'trace_network_path'
  ],
  security: [
    'create_iam_role', 'attach_role_policy', 'generate_sts_token', 'list_access_keys', 'rotate_secret_key',
    'audit_mfa_status', 'scan_vulnerability_cve', 'evaluate_iam_simulator', 'enable_guardduty', 'quarantine_compromised_instance',
    'verify_kms_key_policy', 'encrypt_data_key', 'decrypt_ciphertext', 'list_security_hub_findings', 'remediate_open_s3',
    'generate_compliance_report', 'revoke_active_sessions', 'inspect_cloudtrail_event', 'enforce_password_policy', 'check_least_privilege'
  ],
  messaging: [
    'send_sqs_message', 'receive_messages', 'purge_queue', 'change_visibility_timeout', 'create_fifo_queue',
    'publish_sns_notification', 'subscribe_email_endpoint', 'unsubscribe_topic', 'route_event_bus', 'create_dead_letter_queue',
    'redrive_dlq_messages', 'inspect_message_attributes', 'batch_send_messages', 'delete_queue', 'set_queue_attributes',
    'filter_sns_subscriptions', 'publish_websocket_frame', 'broadcast_presence', 'acknowledge_message_receipt', 'get_queue_depth'
  ],
  database: [
    'execute_sql_query', 'create_database_table', 'drop_database_table', 'create_table_index', 'analyze_slow_queries',
    'take_rds_snapshot', 'restore_from_snapshot', 'failover_multi_az', 'modify_instance_class', 'tune_connection_pool',
    'list_active_locks', 'kill_stuck_query', 'export_table_parquet', 'import_csv_dump', 'enable_read_replica',
    'promote_replica_to_primary', 'vacuum_analyze_tables', 'monitor_replication_lag', 'set_parameter_group', 'mask_sensitive_columns'
  ],
  devops: [
    'trigger_build_pipeline', 'cancel_running_build', 'list_git_tags', 'create_deployment_release', 'rollback_to_previous_sha',
    'get_pipeline_stage_status', 'promote_to_production', 'run_smoke_tests', 'deploy_helm_chart', 'update_kubernetes_manifest',
    'drain_canary_traffic', 'scale_pod_replicas', 'audit_commit_signature', 'verify_artifact_checksum', 'diff_env_configs',
    'lock_deployment_window', 'notify_slack_release', 'generate_release_notes', 'inspect_ci_build_logs', 'archive_build_artifacts'
  ]
};

export const TOOLS: Tool[] = CONSTELLATIONS.flatMap((c) => {
  const tools = CATEGORY_TOOLS_CONFIG[c.id] || [];
  return tools.map((name, i) => {
    const coords = cluster(c.cx, c.cy, i, tools.length);
    const readableName = name.replace(/_/g, ' ');
    return {
      id: `${c.id}.${name}`,
      category: c.id,
      name,
      descriptor: `Executes ${readableName} operation inside ${c.domain} subsystem`,
      description: `Simulated production tool to perform ${readableName} with strict parameter checking and audit logging in ${c.domain}.`,
      x: coords.x,
      y: coords.y
    };
  });
});
