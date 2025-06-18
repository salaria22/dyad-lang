  model Sim_Reservoir_2_Manifold
    // Simulation of Oil Production from Reservoir to Manifold
    // author: 	Bernt Lie
    //			University of South-Eastern Norway
	//			October 3, 2022
	//
	// Instantiate model of Reservoir-to-Manifold system
	//Mod_GenericPipe G;
	Mod_Reservoir_2_Manifold_test R2M;
	// Declaring variables
	// -- inputs
	Real u_p_f "Reservoir formation pressure, Pa";
    Real u_p_m "Manifold pressure, Pa";
	Real u_f_p "Pump rotational frequency, Hz";
	Real u_chi_w "Water cut from reservoir, -";
	// -- outputs
	output Real y_Vd_v_d "Vertical pipe flow per day, m3/d";
	output Real y_p_h_bar "Heel pressure, bar";
	output Real y_p_c_i_bar "Pressure in front of choke valve, bar";
	output Real y_dp_p_bar "Pressure increase in ESP, bar";
	output Real y_dp_f_p "Fraction of friction loss vs. ESP, -";
	output Real y_P_p_kW "Power usage in ESP, kW";
  // Equations
  equation
    // -- input values
	u_p_f = if time < 0.5 then 220e5 else 0.95*220e5;
	u_p_m = if time < 1.5 then 50e5 else 0.97*50e5;
	u_f_p = if time < 2.5 then 60 else 0.95*60;
	u_chi_w = 0.35;
	// -- injecting input functions to model inputs
	//
	R2M.p_f = u_p_f;
	R2M.p_m = u_p_m;
	R2M.f_p = u_f_p;
	R2M.chi_w = u_chi_w;
	// -- outputs
	y_Vd_v_d = R2M.Vd_v*3600*24;
	y_p_h_bar = R2M.p_h/1e5;
	y_p_c_i_bar = R2M.p_c__i/1e5;
	y_dp_p_bar = R2M.Dp_p/1e5;
	y_dp_f_p = R2M.Dp_f/R2M.Dp_p*100;
	y_P_p_kW = R2M.Dp_p*R2M.Vd_v/1e3;
	//
  end Sim_Reservoir_2_Manifold;
